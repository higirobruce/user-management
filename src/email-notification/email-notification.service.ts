import { Injectable } from '@nestjs/common';
import { CreateEmailNotificationDto } from './dto/create-email-notification.dto';
import { UpdateEmailNotificationDto } from './dto/update-email-notification.dto';
import { MailerService } from '@nestjs-modules/mailer';
import * as nodemailer from 'nodemailer'
import { from } from 'rxjs';

@Injectable()
export class EmailNotificationService {
  private transporter;

  constructor(private mailerService: MailerService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',  // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      from: process.env.SMTP_USER,
      requireTLS: process.env.SMTP_REQUIRE_TLS === 'true',
    });
  }

  async sendUserWelcome(to: string, name: string) {
    await this.transporter.sendMail({
      to: to,
      subject: 'Welcome to Our Application!',
      // template: 'welcome',
      html: `
        <p>Hello ${name},</p>
        <p>Welcome to our application! We are glad to have you on board.</p>
      `,
      context: {
        name: name,
      },
    });
  }

  async sendCommentNotification(to: string, actionTitle: string, actionDescription: string, commenterName: string, commentContent: string) {
    await this.transporter.sendMail({
      to: to,
      subject: 'New Comment on Your Post',
      template: 'comment',
      context: {
        actionTitle: actionTitle,
        actionDescription: actionDescription,
        commenterName: commenterName,
        commentContent: commentContent,
      },
    });
  }

  async sendGenericEmail(to: string, subject: string, body: string) {
    let res = await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: body,
    });

    console.log('🚀 sendGenericEmail →', res);
  }
}
