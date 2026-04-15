// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as crypto from 'crypto';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ForgotPasswordDto } from '../users/dto/forgot-password.dto';
import { ResetPasswordDto } from '../users/dto/reset-password.dto';
import { UsersService } from 'src/users/users.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' as const : 'none' as const,
  path: '/',
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  private setTokenCookies(res: Response, tokens: AuthTokens): void {
    res.cookie('access_token', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      path: '/auth/refresh',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
  }

  private clearTokenCookies(res: Response): void {
    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/auth/refresh' });
  }

  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get CSRF token' })
  @ApiResponse({ status: 200, description: 'CSRF token generated' })
  getCsrfToken(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false, // Frontend must read this
      secure: isProduction,
      sameSite: isProduction ? 'strict' as const : 'none' as const,
      path: '/',
    });
    return { csrfToken };
  }

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
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto, req.ip);
    this.setTokenCookies(res, result);
    return {
      message: 'Login successful',
      // Tokens in body for API testing only — frontend should rely on cookies
      ...(isProduction ? {} : { accessToken: result.accessToken, refreshToken: result.refreshToken }),
    };
  }

  @Post('login/mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with MFA' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async loginMFA(@Body() loginDto: LoginDto, @Req() req: any) {
    const result = await this.authService.loginMFA(loginDto, req.ip);
    if ('requiresTwoFactorAuth' in result && result.requiresTwoFactorAuth) {
      return { message: 'Two-factor authentication required', userId: result.userId };
    }
    return { message: 'Login successful' };
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify two-factor authentication code' })
  @ApiResponse({ status: 200, description: '2FA code verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code' })
  async verifyTwoFactorAuthentication(
    @Body() verifyTwoFactorDto: VerifyTwoFactorDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
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
    await this.activityLogService.log(
      ActivityAction.LOGIN_MFA_VERIFIED,
      `User ${user.email} completed MFA login`,
      user.id,
      { email: user.email, method: 'mfa' },
      req.ip,
    );
    this.setTokenCookies(res, tokens);
    return {
      message: '2FA verification successful',
      ...(isProduction ? {} : { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
    };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshTokens(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(
      user.sub,
      user.refreshToken,
    );
    this.setTokenCookies(res, tokens);
    return { message: 'Tokens refreshed successfully' };
  }

  @Post('logout')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sub);
    this.clearTokenCookies(res);
    return { message: 'Logout successful' };
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
