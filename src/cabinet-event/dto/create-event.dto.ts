import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { EventCategory } from '../entities/event.entity';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  venue: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: EventCategory, required: false })
  @IsEnum(EventCategory)
  @IsOptional()
  category: EventCategory;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  buttonLabel: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  externalLink: string;
}
