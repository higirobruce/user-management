import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ActivityLogService } from './activity-log.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

@ApiTags('Activity Logs')
@Controller('activity-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get activity logs (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Activity logs retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAll(@Query() query: QueryActivityLogDto) {
    const result = await this.activityLogService.findAll(query);
    return {
      message: 'Activity logs retrieved successfully',
      ...result,
    };
  }
}
