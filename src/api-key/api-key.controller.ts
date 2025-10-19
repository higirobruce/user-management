import { Controller, Post, UseGuards, Body, Get } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('api-keys')
@ApiBearerAuth()
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create an API key' })
  @ApiResponse({
    status: 201,
    description: 'The API key has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You do not have permission to create API keys.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async create(
    @CurrentUser() user: User,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
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

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiResponse({ status: 200, description: 'A list of API keys.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You do not have permission to view API keys.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async findAll() {
    return this.apiKeyService.findAll();
  }
}
