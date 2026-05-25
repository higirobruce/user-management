import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { CreateCommentNotificationDto } from './dto/create-comment-notification.dto';
import { ApiBasicAuth, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('email')
@ApiBasicAuth()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('comment')
  @ApiOperation({ summary: 'Send a comment notification email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request. Invalid email data.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  create(@Body() createCommentNotificationDto: CreateCommentNotificationDto) {
    return this.emailService.sendCommentNotification(
      createCommentNotificationDto.to,
      createCommentNotificationDto.actionTitle,
      createCommentNotificationDto.actionDescription,
      createCommentNotificationDto.commenterName,
      createCommentNotificationDto.commentContent,
    );
  }

  @Get('test')
  @ApiOperation({ summary: 'Test email sending' })
  @ApiResponse({ status: 200, description: 'Email sent successfully.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  test() {
    return { message: 'Email sent successfully' };
  }
}
