import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PmsService } from './pms.service';

@Controller('pms')
export class PmsController {
  constructor(private readonly pmsService: PmsService) {}
  @Get('projects/:institution')
  getProjects(@Param('institution') institution: string) {
    return this.pmsService.getRemoteProjects(institution);
  }

  @Post('projects/batch')
  getProjectsBatch(@Body('institutions') institutions: string[]) {
    return this.pmsService.getRemoteProjectsParallel(institutions);
  }

  @Post('projects/byIds')
  getProjectsByIds(
    @Body() body: { institutions: string[]; ids: (string | number)[] },
  ) {
    const { institutions, ids } = body;
    return this.pmsService.getProjectsByIds(institutions, ids);
  }
}
