import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors, UseGuards } from '@nestjs/common';
import { EmailNotificationService } from './email-notification.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateEmailNotificationDto } from './dto/create-email-notification.dto';

@Controller('email-notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class EmailNotificationController {
  constructor(private readonly emailNotificationService: EmailNotificationService) { }

  @Post('welcome')
  @ApiOperation({ summary: 'Send a welcome email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request. Invalid email data.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async sendWelcomeEmail(@Body() body: { to: string; name: string }) {
    await this.emailNotificationService.sendUserWelcome(body.to, body.name);
  }

  @Post('generic')
  @UseInterceptors(FilesInterceptor('attachments')) // expects field name "attachments"
  @ApiOperation({ summary: 'Send a generic email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request. Invalid email data.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async sendGenericEmail(
    @Body() body: CreateEmailNotificationDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return await this.emailNotificationService.sendGenericEmail(
      body.to,
      body.subject,
      body.body,
      files,
    );
  }
}
