import { UserNotification } from '../../notification/entities/user-notification.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiKey } from '../../api-key/api-key.entity';
import { Exclude } from 'class-transformer';
import { Availability } from '../../availability/entities/availability.entity';

export enum UserRole {
  ADMIN = 'admin',
  MINISTER = 'minister',
  PS = 'PS',
  CEO = 'CEO',
  DEPUTY_CEO = 'Deputy CEO',
  PRIME_MINISTER = 'Prime Minister',
  MINISTER_OPM = 'Minister in OPM',
  CDO='CDO',
  OVERSIGHT = 'Oversight',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column()
  ministry: string;

  @Column({ nullable: true })
  title: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MINISTER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken: string;

  @Column({ nullable: true })
  @Exclude()
  passwordResetExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];

  @OneToMany(() => Availability, (availability) => availability.user)
  availabilities: Availability[];

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.user,
  )
  userNotifications: UserNotification[];

  @Column({ type: 'varchar', nullable: true })
  twoFactorSecret: string;

  @Column({ type: 'boolean', default: false, nullable:true })
  isTwoFactorEnabled: boolean;
}
