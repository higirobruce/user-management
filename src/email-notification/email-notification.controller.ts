import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailNotificationService } from './email-notification.service';

@Controller('email-notification')
export class EmailNotificationController {
  constructor(private readonly emailNotificationService: EmailNotificationService) {}

  @Post('welcome')
  async sendWelcomeEmail(@Body() body: { to: string; name: string }) {
    await this.emailNotificationService.sendUserWelcome(body.to, body.name);
  }
}
