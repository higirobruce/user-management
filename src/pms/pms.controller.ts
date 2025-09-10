import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PmsService } from './pms.service';
import { CreatePmsDto } from './dto/create-pms.dto';
import { UpdatePmsDto } from './dto/update-pms.dto';


@Controller('pms')
export class PmsController {
  constructor(private readonly pmsService: PmsService) { }

  @Get('projects')
  getProjects() {
    return this.pmsService.getRemoteProjects();
  }

}
