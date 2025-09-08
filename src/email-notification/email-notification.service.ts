import { Injectable } from '@nestjs/common';
import { CreateEmailNotificationDto } from './dto/create-email-notification.dto';
import { UpdateEmailNotificationDto } from './dto/update-email-notification.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailNotificationService {
  constructor(private mailerService: MailerService) {}

  async sendUserWelcome(to: string, name: string) {
    await this.mailerService.sendMail({
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
    await this.mailerService.sendMail({
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
}
