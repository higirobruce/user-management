import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { AvailabilityModule } from './availability/availability.module';
import { EmailModule } from './email/email.module';
import { EmailNotificationModule } from './email-notification/email-notification.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'user_management',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production', // Set to false in production
    }),
    UserModule,
    AuthModule,
    ApiKeyModule,
    AvailabilityModule,
    EmailModule,
    EmailNotificationModule,
  ], 
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
