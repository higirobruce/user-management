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

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
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

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async findMine(@CurrentUser() user: User) {
    return this.availabilityService.findForUser(user.id);
  }

  //get all availabilities
  @UseGuards(JwtAuthGuard)
  @Get('all')
  async findAll() {
    return this.availabilityService.findAll();
  }

  //update availability
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(id, currentUser, updateAvailabilityDto);
  }

  //update availability
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.availabilityService.delete(id, currentUser);
  }

  //delete all availabilities
  @UseGuards(JwtAuthGuard)
  @Delete('all')
  async deleteAll(@CurrentUser() user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to delete all availabilities.');
    }
    return this.availabilityService.deleteAll();
  }

}
