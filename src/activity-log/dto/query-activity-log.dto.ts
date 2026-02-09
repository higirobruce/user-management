import { IsEnum, IsOptional, IsUUID, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ActivityAction } from '../entities/activity-log.entity';

export class QueryActivityLogDto {
  @ApiPropertyOptional({ enum: ActivityAction })
  @IsOptional()
  @IsEnum(ActivityAction)
  action?: ActivityAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
