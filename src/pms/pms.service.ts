import { Injectable } from '@nestjs/common';
import { PmsIntegrationService } from './pms-integration.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PmsEntity } from './entities/pms.entity';
import { CreatePmsDto } from './dto/create-pms.dto';
import { UpdatePmsDto } from './dto/update-pms.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PmsService {
  constructor(
    @InjectRepository(PmsEntity)
    private pmsRepository: Repository<PmsEntity>,
    private readonly integrationService: PmsIntegrationService,
    private readonly configService: ConfigService,
  ) { }

  findAll(): Promise<PmsEntity[]> {
    return this.pmsRepository.find();
  }

  findOne(id: number): Promise<PmsEntity> {
    return this.pmsRepository.findOneBy({ id });
  }

  async create(createPmsDto: CreatePmsDto): Promise<PmsEntity> {
    return this.pmsRepository.save(createPmsDto);
  }

  async update(id: number, updatePmsDto: UpdatePmsDto): Promise<PmsEntity> {
    await this.pmsRepository.update(id, updatePmsDto);
    return this.pmsRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.pmsRepository.delete(id);
  }

  // Remote integration
  async getRemoteProjects(institution: string): Promise<any> {
    return this.integrationService.fetchProjects(institution);
  }

  async getRemoteProjectsParallel(institutions: string[]): Promise<any[]> {
    return this.integrationService.fetchProjectsParallel(institutions);
  }

  async getProjectsByIds(
    institutions: string[],
    ids: (string | number)[],
  ): Promise<any[]> {
    const allInstitutionResponses =
      await this.integrationService.fetchProjectsParallel(institutions);

    // each response: { data: [ { overview: { projectId, ... }, ... } ] }
    const matched: any[] = [];

    for (const resp of allInstitutionResponses) {
      if (!resp?.data || !Array.isArray(resp.data)) continue;

      const filtered = resp.data.filter((item: any) => {
        const projectId =
          item?.overview?.projectId ?? item?.overview?.id ?? item?.id;
        return ids.includes(projectId);
      });

      if (filtered.length) {
        matched.push(...filtered);
      }
    }

    return matched;
  }

  async getProjectsByProgramId(programId: string, institutionName: string): Promise<any> {
    return this.integrationService.fetchProjectsByProgramId(programId, institutionName);
  }

  async getAllMegaProjects(): Promise<any> {
    return this.integrationService.fetchAllMegaProjects();
  }

  async getAllPrograms(): Promise<any> {
    return this.integrationService.fetchAllPrograms();
  }
}
