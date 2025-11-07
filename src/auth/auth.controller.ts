// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ForgotPasswordDto } from '../users/dto/forgot-password.dto';
import { ResetPasswordDto } from '../users/dto/reset-password.dto';
import { UsersService } from 'src/users/users.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UsersService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return {
      message: 'User registered successfully',
      user: user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return result;
  }

  @Post('login/mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with MFA' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async loginMFA(@Body() loginDto: LoginDto) {
    const result = await this.authService.loginMFA(loginDto);
    if ('requiresTwoFactorAuth' in result && result.requiresTwoFactorAuth) {
      return { message: 'Two-factor authentication required', userId: result.userId };
    }
    return result;
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify two-factor authentication code' })
  @ApiResponse({ status: 200, description: '2FA code verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  async verifyTwoFactorAuthentication(@Body() verifyTwoFactorDto: VerifyTwoFactorDto) {

    const user = await this.userService.findOne(verifyTwoFactorDto.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    const isCodeValid = await this.authService.validateTwoFactorAuthentication(
      user,
      verifyTwoFactorDto.otp,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid two-factor authentication code');
    }
    const tokens = await this.authService.generateTokens(user);
    await this.authService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshTokens(@CurrentUser() user: any) {
    const tokens = await this.authService.refreshTokens(
      user.sub,
      user.refreshToken,
    );
    return {
      message: 'Tokens refreshed successfully',
      ...tokens,
    };
  }

  @Post('logout')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@CurrentUser() user: any) {
    await this.authService.logout(user.sub);
    return {
      message: 'Logout successful',
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.userService.requestPasswordChange(forgotPasswordDto.email);
    return {
      message: 'Password reset email sent successfully',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.userService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return {
      message: 'Password reset successfully',
    };
  }
}
