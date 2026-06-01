import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const host = configService.get<string>('database.host');
        const port = configService.get<number>('database.port') || 5432;
        const database = configService.get<string>('database.name');

        logger.log(
          `Connecting to PostgreSQL: host=${host}, port=${port}, db=${database}`,
        );

        return {
          type: 'postgres',
          host,
          port,
          database,
          username: configService.get<string>('database.user'),
          password: configService.get<string>('database.password'),
          autoLoadEntities: true,
          // Allow TYPEORM_SYNCHRONIZE=true to override for initial schema creation
          synchronize:
            process.env.TYPEORM_SYNCHRONIZE === 'true' ||
            configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') === 'development',
          retryAttempts: 3,
          retryDelay: 3000,
          extra: {
            // pg connection timeout — fail fast instead of hanging
            connectionTimeoutMillis: 10000,
          },
        };
      },
    }),
    FirebaseModule,
  ],
  providers: [SeedService],
})
export class DatabaseModule {}
