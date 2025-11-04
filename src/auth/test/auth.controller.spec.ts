import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RateLimiterService } from '../rate-limiter/rateLimiter.service';
import { CreateUserDto } from 'src/User/dto/CreateUser.dto';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;
  let rateLimiterService: jest.Mocked<RateLimiterService>;
  let res: Partial<Response>;

  beforeEach(() => {
    authService = {
      signIn: jest.fn(),
      verifyToken: jest.fn(),
    } as any;

    rateLimiterService = {
      checkLoginAttempt: jest.fn(),
    } as any;

    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    authController = new AuthController();
    (authController as any).authService = authService;
    (authController as any).rateLimiterService = rateLimiterService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signin', () => {
    const userData: CreateUserDto = {
      email: 'test@test.com',
      password: '123456',
      username: 'TestUser',
    };

    it('deve lançar UnauthorizedException se exceder tentativas', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(false);
      await expect(authController.signin(userData, res as Response)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(rateLimiterService.checkLoginAttempt).toHaveBeenCalledWith('some-ip', 'test@test.com');
    });

    it('deve retornar token e setar cookie no sucesso', async () => {
      rateLimiterService.checkLoginAttempt.mockResolvedValueOnce(true);
      authService.signIn.mockResolvedValueOnce({
        access_token: 'token123',
        message: 'Login successfully',
      });

      const result = await authController.signin(userData, res as Response);

      expect(result).toEqual({
        message: 'Login realizado com sucesso!',
        accessToken: 'token123',
      });

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'token123',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        }),
      );
    });
  });

  describe('logout', () => {
    it('deve limpar o cookie e retornar mensagem', async () => {
      const result = await authController.logout(res as Response);
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(result).toEqual({ message: 'Logout realizado!' });
    });
  });

  describe('me', () => {
    const req = {
      cookies: { access_token: 'valid-token' },
    } as Partial<Request>;

    it('deve lançar UnauthorizedException se não houver token', async () => {
      const reqNoToken = { cookies: {} } as Partial<Request>;
      await expect(authController.me(reqNoToken as Request)).rejects.toThrow(UnauthorizedException);
    });

    it('deve retornar payload do usuário se token for válido', async () => {
      const payload = { sub: '1', email: 'test@test.com' };
      authService.verifyToken.mockResolvedValueOnce(payload);

      const result = await authController.me(req as Request);
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({ user: payload });
    });
  });
});
