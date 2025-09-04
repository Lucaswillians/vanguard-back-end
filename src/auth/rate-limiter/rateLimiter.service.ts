import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { subMinutes } from 'date-fns';
import { LoginAttempt } from './loginAttemp.entity';

@Injectable()
export class RateLimiterService {
  private MAX_ATTEMPTS = 5;
  private BLOCK_TIME = 0.5;
  private CHECK_WINDOW = 0.0833;

  constructor(
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
  ) { }

  async checkLoginAttempt(ip: string, userId?: string): Promise<boolean> {
    const now = new Date();
    const windowStart = subMinutes(now, this.CHECK_WINDOW);
    const blockStart = subMinutes(now, this.BLOCK_TIME);

    const isBlocked = await this.loginAttemptRepository
      .createQueryBuilder('attempt')
      .where('attempt.ip = :ip', { ip })
      .andWhere('attempt.attemptTime > :blockStart', { blockStart })
      .getCount();

    if (isBlocked >= this.MAX_ATTEMPTS) {
      return false;
    }

    const attemptCount = await this.loginAttemptRepository
      .createQueryBuilder('attempt')
      .where('attempt.ip = :ip', { ip })
      .andWhere('attempt.attemptTime > :windowStart', { windowStart })
      .getCount();

    if (attemptCount >= this.MAX_ATTEMPTS) {
      return false;
    }

    await this.loginAttemptRepository.save({
      ip,
      userId,
      attemptTime: now,
    });

    return true;
  }

  async resetAttempts(ip: string, userId?: string): Promise<void> {
    await this.loginAttemptRepository
      .createQueryBuilder()
      .delete()
      .where('ip = :ip', { ip })
      .execute();
  }
}