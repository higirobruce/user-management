import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty({ description: 'The user ID' })
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty({ description: 'The 4-digit OTP received via email' })
  @IsNotEmpty()
  @IsString()
  readonly otp: string;
}