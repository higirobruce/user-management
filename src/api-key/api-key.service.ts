import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey, ApiKeyStatus } from './api-key.entity';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async create(user: User, createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
    const key = crypto.randomBytes(32).toString('hex');
    const apiKey = this.apiKeyRepository.create({
      ...createApiKeyDto,
      key,
      user,
    });
    return this.apiKeyRepository.save(apiKey);
  }

  async findAll(): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({ relations: ['user'] });
  }

  async findByKey(key: string): Promise<ApiKey> {
    return this.apiKeyRepository.findOne({
      where: { key },
      relations: ['user'],
    });
  }

  async validateKey(key: string): Promise<User> {
    const apiKey = await this.findByKey(key);

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKey.status !== ApiKeyStatus.ACTIVE) {
      throw new UnauthorizedException(`API key is ${apiKey.status}`);
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.status = ApiKeyStatus.INACTIVE;
      await this.apiKeyRepository.save(apiKey);
      throw new UnauthorizedException('API key has expired');
    }

    apiKey.lastUsedAt = new Date();
    await this.apiKeyRepository.save(apiKey);

    return apiKey.user;
  }
}
