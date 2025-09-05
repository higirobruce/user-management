import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { UserModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey]), forwardRef(() => UserModule)],
  providers: [ApiKeyService],
  controllers: [ApiKeyController],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
