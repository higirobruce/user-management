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
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: 'mail.gov.rw',// config.get<string>('SMTP_HOST'),
          port: 25, //config.get<number>('SMTP_PORT'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASSWORD'),
          },
          tls: {
            rejectUnauthorized: false, // sometimes needed if using self-signed certs
          },

        },
        defaults: {
          from: config.get<string>('SMTP_USER'),
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailNotificationController],
  providers: [EmailNotificationService],
})
export class EmailNotificationModule { }
