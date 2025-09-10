import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PmsService } from './pms.service';
import { CreatePmsDto } from './dto/create-pms.dto';
import { UpdatePmsDto } from './dto/update-pms.dto';


@Controller('pms')
export class PmsController {
  constructor(private readonly pmsService: PmsService) { }

@Get('projects/:institution')
  getProjects(@Param('institution') institution: string) {
    return this.pmsService.getRemoteProjects(institution);
  }

  @Post('projects/batch')
  getProjectsBatch(@Body('institutions') institutions: string[]) {
    return this.pmsService.getRemoteProjectsParallel(institutions);
  }

}
