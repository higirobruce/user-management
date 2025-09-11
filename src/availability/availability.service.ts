import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    userId: string,
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<Availability> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const { userId: dtoUserId, ...restOfDto } = createAvailabilityDto;

    const availability = this.availabilityRepository.create({
      ...restOfDto,
      user,
    });
    return this.availabilityRepository.save(availability);
  }

  async findForUser(userId: string): Promise<any[]> {
    return this.availabilityRepository.find({
      where: { user: { id: userId } },
      order: { startDate: 'DESC' },
      relations: ['user'],
    });
  }

  async findAll(): Promise<any[]> {
    return this.availabilityRepository.find({
      order: { startDate: 'DESC' },
      relations: ['user'], //don't return user's password
    });
  }

  async delete(id: string, currentUser: User) {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      availability.user.id !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You are not allowed to delete availabilities of other users.',
      );
    }

    return this.availabilityRepository.delete(id);
  }

  async deleteAll() {
    return this.availabilityRepository.delete({});
  }

  async update(
    id: string,
    currentUser: User,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      availability.user.id !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You are not allowed to update availabilities of other users.',
      );
    }

    return this.availabilityRepository.update(id, updateAvailabilityDto);
  }
}
