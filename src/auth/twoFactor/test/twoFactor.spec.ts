// twoFactor.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TwoFactorService } from '../twoFactor.service';
import { TwoFactorCodeEntity } from '../twoFactor.entity';
import { EmailSenderService } from '../../../email-sender/emailSender.service';

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let repo: Repository<TwoFactorCodeEntity>;
  let emailSender: EmailSenderService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockEmailSender = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        { provide: getRepositoryToken(TwoFactorCodeEntity), useValue: mockRepo },
        { provide: EmailSenderService, useValue: mockEmailSender },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    repo = module.get<Repository<TwoFactorCodeEntity>>(getRepositoryToken(TwoFactorCodeEntity));
    emailSender = module.get<EmailSenderService>(EmailSenderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCode', () => {
    it('should create a code, save it and send an email', async () => {
      const email = 'user@example.com';
      const fakeRecord = { email, code: 'ABC123' };

      mockRepo.create.mockReturnValue(fakeRecord);
      mockRepo.save.mockResolvedValue(fakeRecord);
      mockEmailSender.sendEmail.mockResolvedValue(undefined);

      const result = await service.createCode(email);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ email, code: expect.any(String) }));
      expect(mockRepo.save).toHaveBeenCalledWith(fakeRecord);
      expect(mockEmailSender.sendEmail).toHaveBeenCalledWith(
        email,
        expect.any(String),
        expect.stringContaining('Seu código é:')
      );
      expect(result).toEqual({ message: 'Código para autenticação enviado para o email' });
    });
  });

  describe('validateCode', () => {
    it('should validate a correct code and delete it', async () => {
      const record = { id: 1, email: 'user@example.com', code: 'ABC123', createdAt: new Date() };
      mockRepo.findOne.mockResolvedValue(record);
      mockRepo.delete.mockResolvedValue({});

      const result = await service.validateCode(record.email, record.code);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: record.email, code: record.code } });
      expect(mockRepo.delete).toHaveBeenCalledWith(record.id);
      expect(result).toEqual({ valid: true });
    });

    it('should throw NotFoundException if code does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(undefined);

      await expect(service.validateCode('user@example.com', 'WRONGCODE'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw NotFoundException if code is expired', async () => {
      const oldDate = new Date(Date.now() - (11 * 60 * 1000)); // 11 minutes ago
      const record = { id: 1, email: 'user@example.com', code: 'ABC123', createdAt: oldDate };
      mockRepo.findOne.mockResolvedValue(record);
      mockRepo.delete.mockResolvedValue({});

      await expect(service.validateCode(record.email, record.code))
        .rejects
        .toThrow(NotFoundException);

      expect(mockRepo.delete).toHaveBeenCalledWith(record.id); // código expirado é deletado
    });
  });
});
