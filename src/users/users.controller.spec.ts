import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ApiKeyGuard } from '../api-key/guards/api-key.guard';
import { ApiKeyService } from '../api-key/api-key.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: {} },
{ provide: ApiKeyGuard, useValue: { canActivate: () => true } },
        { provide: ApiKeyService, useValue: { validateKey: () => ({ id: 'user' }) } },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
