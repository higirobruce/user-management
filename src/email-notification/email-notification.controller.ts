import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { EmailNotificationService } from './email-notification.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('email-notification')
export class EmailNotificationController {
  constructor(private readonly emailNotificationService: EmailNotificationService) { }

  @Post('welcome')
  async sendWelcomeEmail(@Body() body: { to: string; name: string }) {
    await this.emailNotificationService.sendUserWelcome(body.to, body.name);
  }

  @Post('generic')
  @UseInterceptors(FilesInterceptor('attachments')) // expects field name "attachments"
  async sendGenericEmail(
    @Body() body: { to: string; subject: string; body: string },
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    await this.emailNotificationService.sendGenericEmail(
      body.to,
      body.subject,
      body.body,
      files,
    );
  }
}
