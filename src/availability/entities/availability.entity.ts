import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AbsenceReason {
  ON_LEAVE = 'On leave',
  OUT_OF_COUNTRY = 'Out of country',
  OUT_OF_KIGALI = 'Out of Kigali',
}

@Entity()
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AbsenceReason,
  })
  reason: AbsenceReason;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  destination: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @ManyToOne(() => User, (user) => user.availabilities)
  user: User;
}
