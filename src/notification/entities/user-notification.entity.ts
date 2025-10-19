import { User } from '../../users/entities/user.entity';
import { Notification } from './notification.entity';
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userNotifications)
  user: User;

  @ManyToOne(
    () => Notification,
    (notification) => notification.userNotifications,
  )
  notification: Notification;

  @Column({ default: false })
  read: boolean;
}
