import { NotificationModule } from './notification/notification.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
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
    // Single global throttler at 100 req/min per IP. Stricter limits on
    // auth/password-reset routes are applied via @Throttle({ default: ... })
    // — defining extra named throttlers here would make them apply to every
    // route, not just the ones we decorate.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
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
  ],
})
export class AppModule {}
