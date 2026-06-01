import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app!: admin.app.App;

  onModuleInit() {
    if (admin.apps.length === 0) {
      const useEmulator = !!process.env['FIREBASE_AUTH_EMULATOR_HOST'];
      if (useEmulator) {
        this.logger.log(
          `Using Firebase Auth Emulator at ${process.env['FIREBASE_AUTH_EMULATOR_HOST']}`,
        );
        this.app = admin.initializeApp({ projectId: 'igneous-sum-496810-k1' });
      } else {
        this.app = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
    } else {
      this.app = admin.apps[0]!;
    }
  }

  get auth(): admin.auth.Auth {
    return this.app.auth();
  }
}
