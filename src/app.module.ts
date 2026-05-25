import { NotificationModule } from './notification/notification.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/guards/roles.guard';
import { UserModule } from './users/users.module';
import { AvailabilityModule } from './availability/availability.module';
import { EmailModule } from './email/email.module';
import { EmailNotificationModule } from './email-notification/email-notification.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PmsModule } from './pms/pms.module';
import { EventModule } from './cabinet-event/event.module';
import { ActivityLogModule } from './activity-log/activity-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // autoLoadEntities: true,
        synchronize: true, // careful in production!
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      // Default: 100 req/min per IP for everything
      { name: 'default', ttl: 60_000, limit: 100 },
      // Strict: 5 req/min — login, MFA, 2FA verification
      { name: 'auth', ttl: 60_000, limit: 5 },
      // Very strict: 3 req per 15 min — password reset/change flows
      { name: 'password-reset', ttl: 15 * 60_000, limit: 3 },
    ]),
    UserModule,
    AuthModule,
    AvailabilityModule,
    EmailModule,
    EmailNotificationModule,
    PmsModule,
    EventModule,
    NotificationModule,
    ActivityLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
