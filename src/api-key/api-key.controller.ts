import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user: User, @Body() createApiKeyDto: CreateApiKeyDto) {
    const apiKey = await this.apiKeyService.create(user, createApiKeyDto);
    // Return only the key and metadata, not the full entity with user object
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key, // Only show the key on creation
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    };
  }
}