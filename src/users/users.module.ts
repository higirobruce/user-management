import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ApiKeyModule } from 'src/api-key/api-key.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailNotificationModule } from 'src/email-notification/email-notification.module';
import { EmailNotificationService } from 'src/email-notification/email-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => ApiKeyModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' }, // Token expires in 1 hour
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, EmailNotificationService],
  exports: [UsersService],
})
export class UserModule {}
