import { Test, TestingModule } from '@nestjs/testing';
import { PmsService } from './pms.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PmsEntity } from './entities/pms.entity';
import { PmsIntegrationService } from './pms-integration.service';

describe('PmsService', () => {
  let service: PmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<PmsService>(PmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
