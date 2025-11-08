import { RateLimiterService } from '../rateLimiter.service';
import { Repository } from 'typeorm';
import { LoginAttempt } from '../loginAttemp.entity';

describe('RateLimiterService', () => {
  let service: RateLimiterService;
  let repo: jest.Mocked<Repository<LoginAttempt>>;

  beforeEach(() => {
    repo = {
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
    } as any;

    service = new RateLimiterService(repo);
  });

  describe('checkLoginAttempt', () => {
    const ip = '127.0.0.1';
    const userId = 'user123';

    const mockQueryBuilder = (count: number) => {
      const query = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(count),
      };
      return query;
    };

    it('deve bloquear se o IP tiver muitas tentativas recentes (isBlocked)', async () => {
      const qb = mockQueryBuilder(5);
      repo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.checkLoginAttempt(ip, userId);
      expect(result).toBe(false);
      expect(repo.createQueryBuilder).toHaveBeenCalled();
    });

    it('deve bloquear se o IP exceder o limite na janela de tempo', async () => {
      const qb1 = mockQueryBuilder(0);
      const qb2 = mockQueryBuilder(5);

      repo.createQueryBuilder
        .mockReturnValueOnce(qb1 as any)
        .mockReturnValueOnce(qb2 as any);

      const result = await service.checkLoginAttempt(ip, userId);
      expect(result).toBe(false);
    });

    it('deve permitir tentativa e salvar se estiver dentro do limite', async () => {
      const qb1 = mockQueryBuilder(0);
      const qb2 = mockQueryBuilder(2);

      repo.createQueryBuilder
        .mockReturnValueOnce(qb1 as any)
        .mockReturnValueOnce(qb2 as any);

      repo.save.mockResolvedValueOnce({} as any);

      const result = await service.checkLoginAttempt(ip, userId);

      expect(result).toBe(true);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ip,
          userId,
          attemptTime: expect.any(Date),
        }),
      );
    });
  });

  describe('resetAttempts', () => {
    it('deve deletar todas as tentativas do IP', async () => {
      const execute = jest.fn().mockResolvedValue({});
      const qb = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute,
      };

      repo.createQueryBuilder.mockReturnValue(qb as any);

      await service.resetAttempts('127.0.0.1');

      expect(repo.createQueryBuilder).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('ip = :ip', { ip: '127.0.0.1' });
      expect(execute).toHaveBeenCalled();
    });
  });
});
