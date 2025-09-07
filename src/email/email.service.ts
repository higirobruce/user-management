import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendUserWelcome(to: string, name: string) {
    await this.mailerService.sendMail({
      to: to,
      subject: 'Welcome to Our Application!',
      template: 'welcome',
      context: {
        name: name,
      },
    });
  }

  async sendPasswordReset(to: string, name: string, resetLink: string) {
    await this.mailerService.sendMail({
      to: to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        name: name,
        resetLink: resetLink,
      },
    });
  }

  async sendCommentNotification(to: string, actionTitle: string, actionDescription: string, commenterName: string, commentContent: string) {
    await this.mailerService.sendMail({
      to: to,
      subject: 'New Comment on Action',
      template: 'comment-notification',
      context: {
        actionTitle: actionTitle,
        actionDescription: actionDescription,
        commenterName: commenterName,
        commentContent: commentContent,
      },
    });
  }
}
