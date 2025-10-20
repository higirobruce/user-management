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
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UsersService } from '../users/users.service';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    const users = await this.usersService.findUsersByIds(
      createNotificationDto.userIds,
    );
    return this.notificationService.createNotification(
      createNotificationDto.title,
      createNotificationDto.message,
      users,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: User) {
    return this.notificationService.getNotificationsForUser(user.id);
  }

  @Get('unread')
  @UseGuards(JwtAuthGuard)
  getUnreadNotifications(@CurrentUser() user: User) {
    return this.notificationService.getUnreadNotificationsForUser(user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationService.markAsRead(id, user.id);
  }
}
