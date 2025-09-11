import { Module } from '@nestjs/common';
import { EmailNotificationService } from './email-notification.service';
import { EmailNotificationController } from './email-notification.controller';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // load .env globally
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        let transportConfig = {
          host: config.get<string>('SMTP_HOST1'),
          port: Number(config.get<string>('SMTP_PORT')),
          secure: config.get<string>('SMTP_SECURE') === 'true',  // parse manually
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASSWORD'),
          },
          from: config.get<string>('SMTP_FROM_EMAIL'),
          requireTLS: config.get<string>('SMTP_REQUIRE_TLS') === 'true', // parse manually
        }
        return {
          transport: transportConfig,
          
        }
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailNotificationController],
  providers: [EmailNotificationService],
})
export class EmailNotificationModule { }
