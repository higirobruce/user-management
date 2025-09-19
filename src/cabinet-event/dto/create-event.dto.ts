import { IsDateString } from "class-validator";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export class CreateEventDto {
    title: string;

    description: string;

    venue: string;

    @IsDateString()
    startDate: Date;

    @IsDateString()
    endDate: Date;
}
