import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EnableTwoFactorDto {
  @ApiProperty({ description: 'The 4-digit OTP received via email' })
  @IsNotEmpty()
  @IsString()
  readonly otp: string;
}