import { Module } from '@nestjs/common';
import { EmailNotificationService } from './email-notification.service';
import { EmailNotificationController } from './email-notification.controller';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async () => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'brucehigiro2@gmail.com', //configService.get<string>('SMTP_USER'),
            pass: 'mcfectxytiboymvg', //configService.get<string>('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: `"No Reply" <brucehigiro2@gmail.com>`,
        },
        template: {
          dir: path.join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  controllers: [EmailNotificationController],
  providers: [EmailNotificationService],
})
export class EmailNotificationModule {}
