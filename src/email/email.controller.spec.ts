import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

describe('EmailController', () => {
  let controller: EmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [EmailService],
    }).compile();

    controller = module.get<EmailController>(EmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  //test the endpoints
  it('should send an email', async () => {
    const result = await controller.test();
    expect(result).toEqual({ message: 'Email sent successfully' });
  });
});
