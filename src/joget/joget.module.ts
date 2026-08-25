import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JogetController } from './joget.controller';
import { JogetService } from './joget.service';

@Module({
  imports: [
    // Bound the upstream calls. A list request fans out to one download per
    // record, so an unresponsive Joget would otherwise hold sockets open
    // indefinitely and drag the whole process down. Scoped to this module —
    // other modules keep their existing client settings.
    HttpModule.register({
      timeout: 30_000,
      maxRedirects: 3,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
    }),
    ConfigModule,
  ],
  controllers: [JogetController],
  providers: [JogetService],
  exports: [JogetService],
})
export class JogetModule {}
