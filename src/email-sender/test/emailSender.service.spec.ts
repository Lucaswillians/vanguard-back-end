import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailSenderService } from '../emailSender.serivce';

jest.mock('nodemailer');
const sendMailMock = jest.fn();
(nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });

describe('EmailSenderService', () => {
  let service: EmailSenderService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailSenderService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'EMAIL_USER') return 'test@example.com';
              if (key === 'EMAIL_PASS') return 'password123';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailSenderService>(EmailSenderService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('deve enviar e-mail chamando nodemailer.sendMail', async () => {
    sendMailMock.mockResolvedValueOnce('ok');

    await service.sendEmail('destinatario@example.com', 'Assunto', 'Corpo');

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'test@example.com',
        pass: 'password123',
      },
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: 'destinatario@example.com',
      subject: 'Assunto',
      text: 'Corpo',
    });
  });
});
