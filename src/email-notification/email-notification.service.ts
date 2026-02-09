import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as nodemailer from 'nodemailer';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';

@Injectable()
export class EmailNotificationService {
  private transporter;

  constructor(
    private mailerService: MailerService,
    private activityLogService: ActivityLogService,
  ) {
    this.transporter = nodemailer.createTransport({
      host:  process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      pool: true,             // <— Keep connections open
      // maxConnections: 3,      // <— Adjust for your traffic
      // maxMessages: 100,       // <— Reuse connection multiple times
      // rateLimit: 5,            // <— Optional, to prevent server overload
      from: process.env.SMTP_USER,
      requireTLS: process.env.SMTP_REQUIRE_TLS === 'true',
      logger: true,   // log to console
      debug: true     // show SMTP conversation
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
    await this.activityLogService.log(
      ActivityAction.EMAIL_SENT,
      `Welcome email sent to ${to}`,
      null,
      { to, emailType: 'welcome', name },
    );
  }

  async sendCommentNotification(
    to: string,
    actionTitle: string,
    actionDescription: string,
    commenterName: string,
    commentContent: string,
    cc: string
  ) {
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
      bcc: cc,
    });
    await this.activityLogService.log(
      ActivityAction.EMAIL_SENT,
      `Comment notification email sent to ${to}`,
      null,
      { to, emailType: 'comment_notification', actionTitle },
    );
  }

  async sendGenericEmail(
    to: string,
    subject: string,
    body: string,
    files: Express.Multer.File[],
    cc:string
  ) {
    const mailOptions: any = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html: body,
      bcc: cc,
    };

    console.log(process.env.SMTP_USER);
    console.log(process.env.SMTP_FROM_EMAIL);

    if (files && files.length > 0) {
      mailOptions.attachments = files.map((file) => ({
        filename: file.originalname,
        content: Buffer.from(file.buffer), // ensure it's a Buffer
        contentType: file.mimetype, // helps Nodemailer handle it
      }));
    }

    this.transporter.sendMail(mailOptions).then(() => {
      console.timeEnd('email');
      this.activityLogService.log(
        ActivityAction.EMAIL_SENT,
        `Generic email sent to ${to}`,
        null,
        { to, subject, emailType: 'generic' },
      );
    }).catch(console.error);

    return {
      message: 'Your message is being processed',
    };
  }
}
