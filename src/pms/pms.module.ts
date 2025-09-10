import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PmsEntity } from './entities/pms.entity';
import { PmsService } from './pms.service';
import { PmsController } from './pms.controller';
import { PmsIntegrationService } from './pms-integration.service';

@Module({
imports: [HttpModule, TypeOrmModule.forFeature([PmsEntity])],
  controllers: [PmsController],
  providers: [PmsService, PmsIntegrationService],
})
export class PmsModule {}
