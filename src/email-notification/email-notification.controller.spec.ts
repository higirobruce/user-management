import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotificationController } from './email-notification.controller';
import { EmailNotificationService } from './email-notification.service';

describe('EmailNotificationController', () => {
  let controller: EmailNotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailNotificationController],
      providers: [EmailNotificationService],
    }).compile();

    controller = module.get<EmailNotificationController>(EmailNotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
