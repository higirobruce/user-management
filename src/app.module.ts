import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { AvailabilityModule } from './availability/availability.module';
import { EmailModule } from './email/email.module';
import { EmailNotificationModule } from './email-notification/email-notification.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PmsModule } from './pms/pms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // careful in production!
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    AvailabilityModule,
    EmailModule,
    EmailNotificationModule,
    PmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
