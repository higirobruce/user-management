import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';


export enum EventCategory {
  CABINET_MEETING = 'Cabinet Meeting',
  COORDINATION_MEETING = 'Coordination Meeting',
  REVIEW_AND_REPORTING_SESSION = 'Review and Reporting Session',
  OFFICIAL_OPENING_OR_LAUNCH = 'Official Opening or Launch',
  ANNIVERSARY_EVENT = 'Anniversary Event',
  INTERNATIONAL_DELEGATIONS_AND_NEGOTIATIONS = 'International Delegations and Negotiations',
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
