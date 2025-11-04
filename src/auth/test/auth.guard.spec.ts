import { AuthGuard } from '../auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let context: any;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() } as any;
    configService = { get: jest.fn().mockReturnValue('secret') } as any;
    guard = new AuthGuard(jwtService, configService);

    context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          cookies: {},
        }),
      }),
    };
  });

  it('deve lançar erro se não houver token', async () => {
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('deve lançar erro se o token for inválido', async () => {
    const req = { headers: { authorization: 'Bearer token' }, cookies: {} };
    context.switchToHttp = () => ({ getRequest: () => req });
    jwtService.verifyAsync.mockRejectedValueOnce(new Error('invalid'));

    await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired token');
  });

  it('deve aceitar token válido e setar req.user', async () => {
    const payload = { sub: '1', email: 'test@test.com' };
    const req = { headers: { authorization: 'Bearer token' }, cookies: {} };
    context.switchToHttp = () => ({ getRequest: () => req });
    jwtService.verifyAsync.mockResolvedValueOnce(payload);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(req['user']).toEqual(payload);
  });
});
