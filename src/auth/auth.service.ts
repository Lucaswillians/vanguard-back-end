import { RecaptchaService } from './recaptcha/recaptcha.service';
import { Inject, Injectable, Logger, UnauthorizedException, forwardRef } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { RateLimiterService } from "./rate-limiter/rateLimiter.service";
import { UserService } from "../User/user.service";
import { CloudLogger } from '../logger/cloud.logger';

@Injectable()
export class AuthService {
  private readonly saltRounds: number = 10;
  private readonly logger = new (CloudLogger as any)(AuthService.name);

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    @Inject()
    private readonly jwtService: JwtService,

    @Inject()
    private readonly rateLimiterService: RateLimiterService,

    private readonly recaptchaService: RecaptchaService, 
  ) {}

  async hashPassword(password: string): Promise<string> {
    this.logger.log('Hashing password');
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    this.logger.log('Comparing passwords');
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async signIn(email: string, password: string, ip: string, recaptchaToken: string) {
    this.logger.log(`Attempting login for user: ${email} from IP: ${ip}`);

    await this.recaptchaService.validate(recaptchaToken);

    const canAttemptLogin = await this.rateLimiterService.checkLoginAttempt(ip, email);

    if (!canAttemptLogin) {
      this.logger.warn(`Too many login attempts for user: ${email} from IP: ${ip}`);
      throw new UnauthorizedException('Too many login attempts. Please try again later.');
    }

    const user = await this.userService.getOneJWTverify(email);

    if (!user) {
      this.logger.warn(`Login failed: user not found - ${email}`);
      throw new UnauthorizedException('User not found!');
    }

    const passwordMatch = await this.comparePasswords(password, user.password);

    if (!passwordMatch) {
      this.logger.warn(`Login failed: invalid credentials for user - ${email}`);
      throw new UnauthorizedException('Invalid credentials!');
    }

    await this.rateLimiterService.resetAttempts(ip, email);

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRATION,
    });

    this.logger.log(`Login successful for user: ${email}`);
    return {
      message: 'Login successfully',
      access_token: accessToken,
    };
  }

  async verifyToken(token: string) {
    this.logger.log('Verifying JWT token');
    try {
      const verified = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      this.logger.log('Token verification successful');
      return verified;
    } 
    catch (err) {
      this.logger.warn('Token verification failed', err.stack);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
