import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityAction } from './entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async log(
    action: ActivityAction,
    description: string,
    userId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
  ): Promise<ActivityLog> {
    const entry = this.activityLogRepository.create({
      action,
      description,
      userId,
      metadata,
      ipAddress,
    });
    return this.activityLogRepository.save(entry);
  }

  async findAll(filters?: {
    action?: ActivityAction;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ActivityLog[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.action) {
      queryBuilder.andWhere('log.action = :action', {
        action: filters.action,
      });
    }

    if (filters?.userId) {
      queryBuilder.andWhere('log.userId = :userId', {
        userId: filters.userId,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }
}
