import { IsEnum, IsDateString, IsUUID, IsOptional } from 'class-validator';
import { AbsenceReason } from '../entities/availability.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  @ApiProperty()
  @IsEnum(AbsenceReason)
  reason: AbsenceReason;

  @IsOptional()
  @ApiProperty()
  description: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  userId?: string;
}
