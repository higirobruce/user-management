import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ApiKeyModule } from 'src/api-key/api-key.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => ApiKeyModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserModule {}
