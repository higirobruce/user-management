import { Test, TestingModule } from '@nestjs/testing';
import { PmsController } from './pms.controller';
import { PmsService } from './pms.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PmsEntity } from './entities/pms.entity';
import { PmsIntegrationService } from './pms-integration.service';

describe('PmsController', () => {
  let controller: PmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PmsController],
      providers: [
        PmsService,
        {
          provide: getRepositoryToken(PmsEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: PmsIntegrationService,
          useValue: {
            getProjects: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PmsController>(PmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
