import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PmsService } from './pms.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('pms')
@UseGuards(JwtAuthGuard)
export class PmsController {
  constructor(private readonly pmsService: PmsService) { }

  @Get('sectors')
  getSectors() {
    return this.pmsService.fetchSectoList();
  }

  @Get('institutions')
  getInstitutions() {
    return this.pmsService.fetchInstitutionList();
  }

  @Get('projects/allMegaProjects')
  getAllMegaProjects() {
    return this.pmsService.getAllMegaProjects();
  }

  @Get('projects/allPrograms')
  getAllPrograms() {
    return this.pmsService.getAllPrograms();
  }

  @Get('projects/:institution')
  getProjects(@Param('institution') institution: string) {
    return this.pmsService.getRemoteProjects(institution);
  }

  @Post('projects/byProgramId')
  getProjectsByProgramId(@Body() body: { programId: string; institutionName: string }) {
    const { programId, institutionName } = body;
    return this.pmsService.getProjectsByProgramId(programId, institutionName);
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
