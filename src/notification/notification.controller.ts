import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly usersService: UsersService,
  ) {}

  // Untyped body: the global strict ValidationPipe (forbidNonWhitelisted)
  // would otherwise 400 on any extra fields the chat client sends.
  @Post()
  async create(@Body() body: any) {
    const users = await this.usersService.findUsersByIds(body.userIds);
    return this.notificationService.createNotification(
      body.title,
      body.message,
      users,
      body.link,
    );
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.notificationService.getNotificationsForUser(user.id);
  }

  @Get('unread')
  getUnreadNotifications(@CurrentUser() user: User) {
    return this.notificationService.getUnreadNotificationsForUser(user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationService.markAsRead(id, user.id);
  }
}
