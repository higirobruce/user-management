import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateEmailNotificationDto {

    @IsEmail()
    @IsNotEmpty()
    to: string;

    @IsString()
    @IsNotEmpty()
    actionTitle: string;

    @IsString()
    @IsNotEmpty()
    actionDescription: string;

    @IsString()
    @IsNotEmpty()
    commenterName: string;

    @IsString()
    @IsNotEmpty()
    commentContent: string;
}
