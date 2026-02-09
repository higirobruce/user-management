import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async sendUserWelcome(to: string, name: string) {
    await this.mailerService.sendMail({
      to: to,
      subject: 'Welcome to Our Application!',
      template: 'welcome',
      context: {
        name: name,
      },
    });
    await this.activityLogService.log(
      ActivityAction.EMAIL_SENT,
      `Welcome email sent to ${to}`,
      null,
      { to, emailType: 'welcome', name },
    );
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
    await this.activityLogService.log(
      ActivityAction.EMAIL_SENT,
      `Password reset email sent to ${to}`,
      null,
      { to, emailType: 'password_reset', name },
    );
  }

  async sendCommentNotification(
    to: string,
    actionTitle: string,
    actionDescription: string,
    commenterName: string,
    commentContent: string,
  ) {
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
    await this.activityLogService.log(
      ActivityAction.EMAIL_SENT,
      `Comment notification email sent to ${to}`,
      null,
      { to, emailType: 'comment_notification', actionTitle },
    );

    return { message: 'Email sent successfully' };
  }
}
