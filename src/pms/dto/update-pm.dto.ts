import { PartialType } from '@nestjs/swagger';
import { CreatePmDto } from './create-pm.dto';

export class UpdatePmDto extends PartialType(CreatePmDto) {}
