import { Controller, Get, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';
import { CreateCommentNotificationDto } from './dto/create-comment-notification.dto';
import { ApiBasicAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('email')
@ApiBasicAuth()
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
