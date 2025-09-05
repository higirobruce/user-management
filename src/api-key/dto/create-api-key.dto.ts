import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}