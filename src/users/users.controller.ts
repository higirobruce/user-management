// src/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordChangeDto } from './dto/request-password-change.dto';
import { EnableTwoFactorDto } from './dto/enable-two-factor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiKeyGuard } from '../api-key/guards/api-key.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }


  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // @UseGuards(RolesGuard)
  // @UseGuards(ApiKeyGuard)
  // @ApiSecurity('api-key')
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return {
      message: 'User created successfully',
      user: user,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // @UseGuards(ApiKeyGuard)
  @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findAll() {
    const users = await this.userService.findAll();
    return {
      message: 'Users retrieved successfully',
      users,
    };
  }

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // @UseGuards(ApiKeyGuard)
  // @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Param() id: string) {
    const profile = await this.userService.findOne(id);
    return {
      message: 'Profile retrieved successfully',
      user: profile,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // @UseGuards(ApiKeyGuard)
  // @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return {
      message: 'User retrieved successfully',
      user,
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.update(user.id, updateUserDto);
    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(id, updateUserDto);
    return {
      message: 'User updated successfully',
      user,
    };
  }

  @Post('request-password-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password change email' })
  @ApiResponse({ status: 200, description: 'Password change email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async requestPasswordChange(@Body() requestPasswordChangeDto: RequestPasswordChangeDto) {
    await this.userService.requestPasswordChange(requestPasswordChangeDto.email);
    return {
      message: 'Password change request email sent successfully',
    };
  }

  @Patch('profile/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid current password or token',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  // @UseGuards(ApiKeyGuard)
  // @ApiSecurity('api-key')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async deactivate(@Param('id') id: string) {
    const user = await this.userService.deactivate(id);
    return {
      message: 'User deactivated successfully',
      user,
    };
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  // @UseGuards(ApiKeyGuard)
  // @ApiSecurity('api-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async activate(@Param('id') id: string) {
    const user = await this.userService.activate(id);
    return {
      message: 'User activated successfully',
      user,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  // @UseGuards(ApiKeyGuard)
  // @ApiSecurity('api-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return {
      message: 'User deleted successfully',
    };
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({ status: 200, description: 'Two-factor authentication enabled' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async enableTwoFactorAuthentication(
    @CurrentUser() user: User,
  ) {
    await this.userService.enableTwoFactorAuthentication(
      user,
    );
    return { message: 'Two-factor authentication enabled successfully' };
  }
}
