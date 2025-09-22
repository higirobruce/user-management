import { ApiProperty } from "@nestjs/swagger";
import { IsDateString } from "class-validator";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export class CreateEventDto {
    @ApiProperty()
    title: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    venue: string;

    @ApiProperty()
    @IsDateString()
    startDate: Date;

    @ApiProperty()
    @IsDateString()
    endDate: Date;
}
