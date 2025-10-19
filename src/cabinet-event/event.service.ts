import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Repository } from 'typeorm';
import { CabinetEvent } from './entities/event.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(CabinetEvent)
    private eventRepository: Repository<CabinetEvent>,
  ) {}

  async create(createEventDto: CreateEventDto) {
    return await this.eventRepository.save(createEventDto);
  }

  async findAll() {
    return await this.eventRepository.find();
  }

  async findOne(id: string) {
    return await this.eventRepository.findOne({ where: { id } });
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    return await this.eventRepository.update(id, updateEventDto);
  }

  async remove(id: string) {
    return await this.eventRepository.delete(id);
  }
}
