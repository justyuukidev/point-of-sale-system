import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

interface AuthenticatedSocket extends Socket {
  data: {
    tenantId: number;
    userId: number;
    role: string;
    storeId?: number;
  };
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<number, Set<string>>();
  private storeSockets = new Map<number, Set<string>>();

  constructor(private readonly firebaseService: FirebaseService) {}

  afterInit(server: Server) {
    // Socket.IO middleware: verify Firebase JWT on handshake
    server.use(async (socket: Socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = await this.firebaseService.auth.verifyIdToken(token);
        const tenantId = decoded['tenantId'] as number | undefined;
        if (!tenantId) {
          return next(new Error('Token missing tenantId claim'));
        }

        // Attach verified claims to socket.data for use in handlers
        socket.data = {
          tenantId,
          userId: (decoded['dbUserId'] as number) ?? 0,
          role: (decoded['role'] as string) ?? '',
          storeId: decoded['storeId'] as number | undefined,
        };
        next();
      } catch {
        return next(new Error('Invalid authentication token'));
      }
    });
  }

  handleConnection(client: AuthenticatedSocket) {
    const { tenantId, userId, storeId } = client.data;

    // Always join tenant room
    client.join(`tenant:${tenantId}`);

    // Join user-specific room
    if (userId) {
      if (!this.userSockets.has(userId))
        this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
    }

    // Join store room (from token claims, not client-supplied)
    if (storeId) {
      if (!this.storeSockets.has(storeId))
        this.storeSockets.set(storeId, new Set());
      this.storeSockets.get(storeId)!.add(client.id);
      client.join(`store:${storeId}`);
    }

    this.logger.debug(
      `Client connected: user=${userId}, tenant=${tenantId}, store=${storeId}`,
    );
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const { userId, storeId } = client.data ?? {};

    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0)
        this.userSockets.delete(userId);
    }
    if (storeId) {
      this.storeSockets.get(storeId)?.delete(client.id);
      if (this.storeSockets.get(storeId)?.size === 0)
        this.storeSockets.delete(storeId);
    }
  }

  emitToUser(userId: number, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  emitToStore(storeId: number, notification: any) {
    this.server.to(`store:${storeId}`).emit('notification', notification);
  }

  emitBroadcast(tenantId: number, notification: any) {
    this.server.to(`tenant:${tenantId}`).emit('notification', notification);
  }
}
