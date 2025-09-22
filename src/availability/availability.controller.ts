import { Controller, Post, UseGuards, Body, Get, ForbiddenException, Delete, Param, Patch } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('availability')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) { }


  @Post()
  @ApiOperation({ summary: 'Create a new availability' })
  @ApiResponse({ status: 201, description: 'The availability has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden. You do not have permission to create availabilities.' })
  async create(
    @CurrentUser() currentUser: User,
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ) {
    const targetUserId = createAvailabilityDto.userId || currentUser.id;

    // if (createAvailabilityDto.userId && currentUser.role !== UserRole.ADMIN) {
    //   throw new ForbiddenException('You are not allowed to create availability for other users.');
    // }

    return this.availabilityService.create(targetUserId, createAvailabilityDto);
  }


  @Get('mine')
  @ApiOperation({ summary: 'Get all availabilities for the current user' })
  @ApiResponse({ status: 200, description: 'A list of availabilities.' })
  @ApiResponse({ status: 403, description: 'Forbidden. You do not have permission to access availabilities.' })
  async findMine(@CurrentUser() user: User) {
    return this.availabilityService.findForUser(user.id);
  }

  //get all availabilities

  @Get('all')
  @ApiOperation({ summary: 'Get all availabilities' })
  @ApiResponse({ status: 200, description: 'A list of all availabilities.' })
  @ApiResponse({ status: 403, description: 'Forbidden. You do not have permission to access all availabilities.' })
  async findAll() {
    return this.availabilityService.findAll();
  }

  //update availability

  @Patch(':id')
  @ApiOperation({ summary: 'Update an availability' })
  @ApiResponse({ status: 200, description: 'The availability has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden. You do not have permission to update this availability.' })
  @ApiResponse({ status: 404, description: 'Availability not found.' })
  async update(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(id, currentUser, updateAvailabilityDto);
  }

  //update availability

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an availability' })
  @ApiResponse({ status: 200, description: 'The availability has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden. You do not have permission to delete this availability.' })
  @ApiResponse({ status: 404, description: 'Availability not found.' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.availabilityService.delete(id, currentUser);
  }

  //delete all availabilities

  @Delete('all')
  @ApiOperation({ summary: 'Delete all availabilities' })
  @ApiResponse({ status: 200, description: 'All availabilities have been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden. You do not have permission to delete all availabilities.' })
  async deleteAll(@CurrentUser() user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to delete all availabilities.');

    }
    return this.availabilityService.deleteAll();
  }

}
