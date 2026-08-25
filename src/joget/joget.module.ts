import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JogetController } from './joget.controller';
import { JogetService } from './joget.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [JogetController],
  providers: [JogetService],
  exports: [JogetService],
})
export class JogetModule {}
