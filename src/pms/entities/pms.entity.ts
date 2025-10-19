import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PmsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Add other properties as needed
}
