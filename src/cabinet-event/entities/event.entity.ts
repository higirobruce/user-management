import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';


export enum EventCategory {
  CABINET_MEETING = 'Cabinet Meeting',
  REGIONAL_SUMMIT = 'Regional Summit',
  INTERNATIONAL_CONFERENCE = 'International Conference',
  SOCIAL_EVENT = 'Social Event',
  OFFICIAL_STATE_VISIT = 'Official State Visit',
}

@Entity()
export class CabinetEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: EventCategory, nullable: true })
  category: EventCategory;

  @Column()
  description: string;

  @Column({ nullable: true })
  venue: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({nullable: true})
  buttonLabel: string;

  @Column({nullable: true})
  externalLink: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
