import { Injectable } from '@nestjs/common';
import { PmsIntegrationService } from './pms-integration.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PmsEntity } from './entities/pms.entity';
import { CreatePmsDto } from './dto/create-pms.dto';
import { UpdatePmsDto } from './dto/update-pms.dto';

@Injectable()
export class PmsService {
constructor(
    @InjectRepository(PmsEntity)
    private pmsRepository: Repository<PmsEntity>,
    private readonly integrationService: PmsIntegrationService,
  ) {}

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
}
