import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Availability } from './entities/availability.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';

// Helper function to create a mocked repository
function createMockRepository<T>() {
  return {
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  } as unknown as Partial<Repository<T>>;
}

describe('AvailabilityService - Authorization', () => {
  let service: AvailabilityService;
  let availabilityRepository: Partial<Repository<Availability>>;
  let userRepository: Partial<Repository<User>>;

  const owner: User = { id: 'owner-id', role: UserRole.MINISTER } as User;
  const otherUser: User = { id: 'other-id', role: UserRole.MINISTER } as User;
  const admin: User = { id: 'admin-id', role: UserRole.ADMIN } as User;

  const availability: Availability = {
    id: 'avail-id',
    reason: null,
    startDate: new Date(),
    endDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: owner,
  } as unknown as Availability;

  beforeEach(async () => {
    availabilityRepository = createMockRepository<Availability>();
    userRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: getRepositoryToken(Availability),
          useValue: availabilityRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
  });

  describe('delete', () => {
    it('should throw ForbiddenException when non-owner tries to delete', async () => {
      (availabilityRepository.findOne as jest.Mock).mockResolvedValue(
        availability,
      );

      await expect(
        service.delete(availability.id, otherUser as User),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should allow owner to delete', async () => {
      (availabilityRepository.findOne as jest.Mock).mockResolvedValue(
        availability,
      );
      (availabilityRepository.delete as jest.Mock).mockResolvedValue({});

      await expect(
        service.delete(availability.id, owner as User),
      ).resolves.not.toThrow();
      expect(availabilityRepository.delete).toHaveBeenCalledWith(
        availability.id,
      );
    });

    it('should allow admin to delete', async () => {
      (availabilityRepository.findOne as jest.Mock).mockResolvedValue(
        availability,
      );
      (availabilityRepository.delete as jest.Mock).mockResolvedValue({});

      await expect(
        service.delete(availability.id, admin as User),
      ).resolves.not.toThrow();
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException when non-owner tries to update', async () => {
      (availabilityRepository.findOne as jest.Mock).mockResolvedValue(
        availability,
      );

      await expect(
        service.update(availability.id, otherUser as User, {} as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should allow owner to update', async () => {
      (availabilityRepository.findOne as jest.Mock).mockResolvedValue(
        availability,
      );
      (availabilityRepository.update as jest.Mock).mockResolvedValue({});

      await expect(
        service.update(availability.id, owner as User, {} as any),
      ).resolves.not.toThrow();
      expect(availabilityRepository.update).toHaveBeenCalled();
    });
  });
});
