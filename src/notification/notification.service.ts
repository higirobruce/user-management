import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { User, UserStatus } from '../users/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
  ) { }

  async createNotification(
    title: string,
    message: string,
    users: User[],
    link: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      title,
      message,
      link,
      readBy: []
    });
    await this.notificationRepository.save(notification);

    const userNotifications = users.map((user) => {
      //TODO: only active users should receive notifications
      if (user.status !== UserStatus.ACTIVE) {
        return null;
      }
      return this.userNotificationRepository.create({
        user,
        notification,
        read: false,
      });
    });

    await this.userNotificationRepository.save(userNotifications);

    return notification;
  }

  async getNotificationsForUser(userId: string): Promise<UserNotification[]> {
    return this.userNotificationRepository.find({
      where: { user: { id: userId } },
      relations: ['notification'],
    });
  }

  async getUnreadNotificationsForUser(userId: string): Promise<UserNotification[]> {
    const userNotifications = await this.userNotificationRepository.find({
      where: { user: { id: userId } },
      relations: ['notification'],
      order: {
        notification: { createdAt: 'DESC' }
      }
    });

    // Filter out notifications where the userId is present in the notification's readBy array
    return userNotifications.filter(userNotification => {
      const notification = userNotification.notification;
      // If readBy is null or undefined, it means no one has read it, so it's unread for this user.
      // Otherwise, check if the userId is NOT included in the readBy array.
      return !notification.readBy || !notification.readBy.includes(userId);
    });
  }

  async markAsRead(userNotificationId: string, userId: string): Promise<Notification> {
    const userNotification = await this.notificationRepository.findOne({
      where: { id: userNotificationId },
      // relations: ['user'],
    });

    if (!userNotification) {
      throw new NotFoundException(`User notification with ID ${userNotificationId} not found`);
    }

    // Update the individual user-notification record
    // userNotification.read = true;
    await this.userNotificationRepository.save(userNotification);

    // Update the notification's readBy array
    // const notification = userNotification.notification;
    // const userId = userNotification.user.id;

    // Only add the userId if it's not already in the readBy array
    if (!userNotification.readBy) {
      userNotification.readBy = [];
    }

    if (!userNotification.readBy.includes(userId)) {
      userNotification.readBy.push(userId);
      await this.notificationRepository.save(userNotification);
    }

    return userNotification;
  }

  async getReadByUsers(notificationId: string): Promise<string[]> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    return notification.readBy || [];
  }

  async isReadByUser(notificationId: string, userId: string): Promise<boolean> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    return notification.readBy?.includes(userId) || false;
  }
}
