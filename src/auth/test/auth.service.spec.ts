import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { RateLimiterService } from '../rate-limiter/rateLimiter.service';
import { UserService } from '../../User/user.service';
import { GetUserDto } from '../../User/dto/GetUset.dto';
import { TwoFactorService } from '../twoFactor/twoFactor.service';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let rateLimiterService: jest.Mocked<RateLimiterService>;
  let userService: jest.Mocked<UserService>;
  let recaptchaService: any;
  let twoFactorService: jest.Mocked<TwoFactorService>;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
    } as any;

    rateLimiterService = {
      checkLoginAttempt: jest.fn(),
      resetAttempts: jest.fn(),
    } as any;

    userService = {
      getOneJWTverify: jest.fn(),
    } as any;

    recaptchaService = {
      validate: jest.fn().mockResolvedValue(true),
    };

    twoFactorService = {
      is2FAEnabled: jest.fn().mockResolvedValue(false),
      verify2FACode: jest.fn(),
      generate2FAToken: jest.fn(),
      createCode: jest.fn().mockResolvedValue(true),
      validateCode: jest.fn(),
    } as any;

    authService = new AuthService(
      userService,
      jwtService,
      rateLimiterService,
      recaptchaService,
      twoFactorService
    );

    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_EXPIRATION = '1h';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // HASH PASSWORD
  // ============================================================

  describe('hashPassword', () => {
    it('deve gerar um hash válido', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashed');
      const result = await authService.hashPassword('123');
      expect(result).toBe('hashed');
      expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
    });
  });

  // ============================================================
  // COMPARE PASSWORDS
  // ============================================================

  describe('comparePasswords', () => {
    it('deve retornar true se as senhas coincidirem', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as any);
      const result = await authService.comparePasswords('a', 'b');
      expect(result).toBe(true);
    });

    it('deve retornar false se as senhas não coincidirem', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as any);
      const result = await authService.comparePasswords('a', 'b');
      expect(result).toBe(false);
    });
  });

  // ============================================================
  // SIGN IN
  // ============================================================

  describe('signIn', () => {
    const ip = '127.0.0.1';
    const email = 'user@test.com';
    const password = '123456';
    const recaptchaToken = 'mockToken';

    const user = new GetUserDto('1', 'TestUser', email, 'hashedPassword');

    it('deve lançar erro se ultrapassar limite de tentativas', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(false);

      await expect(
        authService.signIn(email, password, ip, recaptchaToken)
      ).rejects.toThrow(UnauthorizedException);

      expect(rateLimiterService.checkLoginAttempt).toHaveBeenCalledWith(ip, email);
    });

    it('deve lançar erro se o usuário não for encontrado', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(true);
      userService.getOneJWTverify.mockResolvedValueOnce(null as any);

      await expect(
        authService.signIn(email, password, ip, recaptchaToken)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar erro se a senha for inválida', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(true);
      userService.getOneJWTverify.mockResolvedValueOnce(user);

      jest.spyOn(authService, 'comparePasswords').mockResolvedValueOnce(false);

      await expect(
        authService.signIn(email, password, ip, recaptchaToken)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve retornar solicitação de 2FA', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(true);
      userService.getOneJWTverify.mockResolvedValueOnce(user);
      jest.spyOn(authService, 'comparePasswords').mockResolvedValueOnce(true);

      const result = await authService.signIn(email, password, ip, recaptchaToken);

      expect(result).toEqual({
        message: '2FA required',
        twoFactorRequired: true,
        email: user.email,
      });
      expect(twoFactorService.createCode).toHaveBeenCalledWith(user.email);
      expect(rateLimiterService.resetAttempts).toHaveBeenCalledWith(ip, email);
    });
  });

  // ============================================================
  // VERIFY TOKEN
  // ============================================================

  describe('verifyToken', () => {
    it('deve retornar payload válido se o token for correto', async () => {
      const payload = { sub: '1', email: 'user@test.com' };
      (jwtService.verify as jest.Mock).mockReturnValueOnce(payload); // síncrono

      const result = await authService.verifyToken('token');

      expect(jwtService.verify).toHaveBeenCalledWith('token', { secret: 'testsecret' });
      expect(result).toEqual(payload);
    });

    it('deve lançar UnauthorizedException se o token for inválido', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(authService.verifyToken('invalid')).rejects.toThrow(UnauthorizedException);
    });
  });
});
