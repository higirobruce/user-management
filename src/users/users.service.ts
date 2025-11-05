import { authenticator } from 'otplib';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserStatus } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailNotificationService } from 'src/email-notification/email-notification.service';
import { isUUID } from 'class-validator';

authenticator.options = { step: 120, window: 2 };

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  async generateTwoFactorSecret(user: User) {
    const secret = authenticator.generateSecret();
    await this.userRepository.update(user.id, { twoFactorSecret: secret });
    return secret;
  }

  async enableTwoFactorAuthentication(user: User) {
    await this.userRepository.update(user.id, {
      twoFactorSecret: user.email,
      isTwoFactorEnabled: true,
    });
  }

  async sendTwoFactorCode(user: User): Promise<void> {
    const otp = authenticator.generate(user.email);
    console.log(`Generated OTP for ${user.email}: ${otp}`);
    const htmlContent = `
      <h1>Your 2FA Code</h1>
      <p>Your two-factor authentication code is: <strong>${otp}</strong></p>
      <p>This code is valid for only 10 minutes. Do not share it with anyone.</p>
    `;
    await this.emailNotificationService.sendGenericEmail(
      user.email,
      'Your 2FA Code',
      htmlContent,
      []
    );
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'ministry',
        'role',
        'status',
        'createdAt',
        'updatedAt',
        'title',
      ],
    });
  }

  async findOne(id: string): Promise<User> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'ministry',
        'role',
        'status',
        'createdAt',
        'updatedAt',
        'title',
        'password',
        'isTwoFactorEnabled',
        'twoFactorSecret',
        'refreshToken',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    //if id is not uuid

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUsersByIds(userIds: string[]): Promise<User[]> {
    return this.userRepository.find({ where: { id: In(userIds) } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async requestPasswordChange(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a JWT token with only the user's ID
    const payload = { sub: user.id };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h', // Token expires in 1 hour
    });

    // Send the token to the user's email
    await this.emailNotificationService.sendGenericEmail(
      user.email,
      'Password Change Request and Token',
      `
        <p>You have requested a password change.</p>
        <p>Here is your password reset token (valid for 1 hour):</p>
        <p><strong>${token}</strong></p>
        <p>Please use this token to change your password.</p>
        <p>If you did not request this change, please contact support immediately.</p>
      `,
      []
    );
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      12,
    );

    user.password = hashedNewPassword;
    user.refreshToken = null; // Invalidate all sessions

    await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.INACTIVE;
    user.refreshToken = null; // Invalidate all sessions
    return this.userRepository.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.status = UserStatus.ACTIVE;
    return this.userRepository.save(user);
  }

  async verifyTwoFactorAuthentication(user: User, otp: string): Promise<boolean> {
    console.log(`Verifying OTP for ${user.email}. Received OTP: ${otp}. Secret: ${user.email}`);
    return authenticator.verify({
      token: otp,
      secret: user.email,
    });
  }
}
