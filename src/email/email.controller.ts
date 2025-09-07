import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailService } from './email.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { CreateCommentNotificationDto } from './dto/create-comment-notification.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('comment')
  create(@Body() createCommentNotificationDto: CreateCommentNotificationDto) {
    return this.emailService.sendCommentNotification(
      createCommentNotificationDto.to, 
      createCommentNotificationDto.actionTitle, 
      createCommentNotificationDto.actionDescription, 
      createCommentNotificationDto.commenterName, 
      createCommentNotificationDto.commentContent);
  }

}
