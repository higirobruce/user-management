import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  link: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  userIds: string[];
}
