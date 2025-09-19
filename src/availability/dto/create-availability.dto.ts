import { IsEnum, IsDateString, IsUUID, IsOptional } from 'class-validator';
import { AbsenceReason } from '../entities/availability.entity';

export class CreateAvailabilityDto {
  @IsEnum(AbsenceReason)
  reason: AbsenceReason;

  @IsOptional()
  description: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}