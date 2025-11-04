import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { RateLimiterService } from '../rate-limiter/rateLimiter.service';
import { UserService } from '../../User/user.service';
import { GetUserDto } from '../../User/dto/GetUset.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let rateLimiterService: jest.Mocked<RateLimiterService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(() => {
    jwtService = {
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

    authService = new AuthService();
    (authService as any).jwtService = jwtService;
    (authService as any).rateLimiterService = rateLimiterService;
    (authService as any).userService = userService;

    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_EXPIRATION = '1h';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('deve gerar um hash válido', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashed');
      const result = await authService.hashPassword('123');
      expect(result).toBe('hashed');
      expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
    });
  });

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

  describe('signIn', () => {
    const ip = '127.0.0.1';
    const email = 'user@test.com';
    const password = '123456';

    // Mock compatível com GetUserDto
    const user = new GetUserDto('1', 'TestUser', email, 'hashedPassword');

    it('deve lançar erro se ultrapassar limite de tentativas', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(false);
      await expect(authService.signIn(email, password, ip)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(rateLimiterService.checkLoginAttempt).toHaveBeenCalledWith(ip, email);
    });

    it('deve lançar erro se o usuário não for encontrado', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(true);
      userService.getOneJWTverify.mockResolvedValueOnce(null as any);
      await expect(authService.signIn(email, password, ip)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar erro se a senha for inválida', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(true);
      userService.getOneJWTverify.mockResolvedValueOnce(user);
      jest.spyOn(authService, 'comparePasswords').mockResolvedValueOnce(false);

      await expect(authService.signIn(email, password, ip)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve retornar token se o login for bem-sucedido', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(true);
      userService.getOneJWTverify.mockResolvedValueOnce(user);
      jest.spyOn(authService, 'comparePasswords').mockResolvedValueOnce(true);
      jwtService.signAsync.mockResolvedValueOnce('token');
      rateLimiterService.resetAttempts.mockResolvedValueOnce(undefined);

      const result = await authService.signIn(email, password, ip);

      expect(result).toEqual({
        message: 'Login successfully',
        access_token: 'token',
      });

      expect(rateLimiterService.resetAttempts).toHaveBeenCalledWith(ip, email);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        { secret: 'testsecret', expiresIn: '1h' },
      );
    });
  });

  describe('verifyToken', () => {
    it('deve retornar payload válido se o token for correto', async () => {
      const payload = { sub: '1', email: 'user@test.com' };
      jwtService.verify.mockReturnValueOnce(payload);
      const result = await authService.verifyToken('token');
      expect(result).toBe(payload);
      expect(jwtService.verify).toHaveBeenCalledWith('token', { secret: 'testsecret' });
    });

    it('deve lançar UnauthorizedException se o token for inválido', async () => {
      jwtService.verify.mockImplementationOnce(() => {
        throw new Error('invalid');
      });
      await expect(authService.verifyToken('invalid')).rejects.toThrow(UnauthorizedException);
    });
  });
});
