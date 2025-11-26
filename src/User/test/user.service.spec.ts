import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user.service';
import { UserEntity } from '../user.entity';
import { PasswordResetCodeEntity } from '../passwordResetCode/passwordResetCode.entity';
import { AuthService } from '../../auth/auth.service';
import { EmailSenderService } from '../../email-sender/emailSender.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from '../dto/UpdateUser.dto';
import { RecaptchaService } from '../../auth/recaptcha/recaptcha.service';

describe('UserService', () => {
  let service: UserService;
  let userRepo: any;
  let resetRepo: any;
  let authService: any;
  let emailSender: any;

  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    username: 'user1',
    email: 'user1@example.com',
    password: 'hashedpass',
  };

  const mockReset = {
    id: 'reset-1',
    email: 'user1@example.com',
    code: 'ABC123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            preload: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PasswordResetCodeEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: { hashPassword: jest.fn().mockResolvedValue('hashedpass') },
        },
        {
          provide: EmailSenderService,
          useValue: { sendEmail: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: RecaptchaService,
          useValue: {
            validate: jest.fn().mockResolvedValue(true), 
          },
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get(getRepositoryToken(UserEntity));
    resetRepo = module.get(getRepositoryToken(PasswordResetCodeEntity));
    authService = module.get(AuthService);
    emailSender = module.get(EmailSenderService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create and save a user', async () => {
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.createUser({
        username: 'user1',
        email: 'user1@example.com',
        password: 'pass123',
        recaptchaToken: 'test-token'
      });

      expect(authService.hashPassword).toHaveBeenCalledWith('pass123');
      expect(userRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUsers', () => {
    it('should return list of users', async () => {
      userRepo.find.mockResolvedValue([mockUser]);

      const result = await service.getUsers();

      expect(result[0]).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        password: mockUser.password,
      });
    });
  });

  describe('getOne', () => {
    it('should return user by id', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getOne(mockUserId);

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        password: mockUser.password,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should update a user and return it', async () => {
      const updateDto: UpdateUserDto = {
        username: 'newUsername',
        email: 'new@example.com',
        password: 'newPassword',
        recaptchaToken: 'test-token'
      };

      const hashedPassword = 'hashedPassword';
      jest.spyOn(authService, 'hashPassword').mockResolvedValue(hashedPassword);

      const preloadedUser = { id: mockUserId, ...updateDto, password: hashedPassword };
      jest.spyOn(userRepo, 'preload').mockResolvedValue(preloadedUser);
      jest.spyOn(userRepo, 'save').mockResolvedValue(preloadedUser);

      const result = await service.updateUser(mockUserId, updateDto);

      expect(authService.hashPassword).toHaveBeenCalledWith('newPassword');
      expect(userRepo.preload).toHaveBeenCalledWith({ id: mockUserId, ...updateDto });
      expect(userRepo.save).toHaveBeenCalledWith(preloadedUser);
      expect(result).toEqual(preloadedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateDto: UpdateUserDto = {
        username: 'newUsername',
        email: 'new@example.com',
        password: 'newPassword',
        recaptchaToken: 'test-token'
      };
      jest.spyOn(userRepo, 'preload').mockResolvedValue(null);

      await expect(service.updateUser('999', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      userRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteUser(mockUserId);

      expect(userRepo.delete).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({ message: 'Usuário deletado com sucesso' }); 
    });
  });

  describe('requestPasswordReset', () => {
    it('should create reset code and send email', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      resetRepo.create.mockReturnValue(mockReset);
      resetRepo.save.mockResolvedValue(mockReset);

      const result = await service.requestPasswordReset(mockUser.email);

      expect(resetRepo.create).toHaveBeenCalled();
      expect(resetRepo.save).toHaveBeenCalled();
      expect(emailSender.sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String),
        expect.stringContaining(mockUser.username),
      );
      expect(result).toEqual({ message: 'Código de redefinição enviado para seu e-mail.' });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.requestPasswordReset('notfound@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateResetCode', () => {
    it('should validate code if not expired', async () => {
      resetRepo.findOne.mockResolvedValue(mockReset);

      const result = await service.validateResetCode(mockUser.email, mockReset.code);

      expect(result).toEqual({ valid: true });
    });

    it('should throw NotFoundException if code expired', async () => {
      const oldDate = new Date(Date.now() - 16 * 60000); // 16 min ago
      resetRepo.findOne.mockResolvedValue({ ...mockReset, createdAt: oldDate });
      resetRepo.delete.mockResolvedValue({});

      await expect(service.validateResetCode(mockUser.email, mockReset.code)).rejects.toThrow(NotFoundException);
      expect(resetRepo.delete).toHaveBeenCalledWith(mockReset.id);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      resetRepo.findOne.mockResolvedValue(mockReset);
      userRepo.findOne.mockResolvedValue(mockUser);
      authService.hashPassword.mockResolvedValue('newhashed');
      resetRepo.delete.mockResolvedValue({});
      emailSender.sendEmail.mockResolvedValue(true);

      const result = await service.resetPassword(mockUser.email, mockReset.code, 'newpass');

      expect(authService.hashPassword).toHaveBeenCalledWith('newpass');
      expect(userRepo.save).toHaveBeenCalled();
      expect(resetRepo.delete).toHaveBeenCalledWith(mockReset.id);
      expect(emailSender.sendEmail).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Senha redefinida com sucesso.' });
    });

    it('should throw NotFoundException if code expired', async () => {
      const oldDate = new Date(Date.now() - 16 * 60000);
      resetRepo.findOne.mockResolvedValue({ ...mockReset, createdAt: oldDate });
      resetRepo.delete.mockResolvedValue({});

      await expect(service.resetPassword(mockUser.email, mockReset.code, 'newpass')).rejects.toThrow(NotFoundException);
    });
  });
});
