import { PartialType } from '@nestjs/mapped-types';
import { CreatePmsDto } from './create-pms.dto';

export class UpdatePmsDto extends PartialType(CreatePmsDto) {
  // Add other properties as needed
}
