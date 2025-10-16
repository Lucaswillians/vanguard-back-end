import { Inject, Injectable, LoggerService, UnauthorizedException, forwardRef } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { RateLimiterService } from "./rate-limiter/rateLimiter.service";
import { UserService } from "../User/user.service";

@Injectable()
export class AuthService {
  private readonly saltRounds: number = 10;

  @Inject(forwardRef(() => UserService))
  private readonly userService: UserService;

  @Inject()
  private readonly jwtService: JwtService;

  @Inject()
  private readonly rateLimiterService: RateLimiterService;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async signIn(email: string, password: string, ip: string) {
    const canAttemptLogin = await this.rateLimiterService.checkLoginAttempt(ip, email)

    if (!canAttemptLogin) {
      throw new UnauthorizedException('Too many login attempts. Please try again later.');
    }

    const user = await this.userService.getOneJWTverify(email);

    if (!user) {
      throw new UnauthorizedException('User not found!');
    }

    const passwordMatch = await this.comparePasswords(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials!');
    }

    await this.rateLimiterService.resetAttempts(ip, email);

    const payload = { sub: user.id, email: user.email };

    return {
      message: 'Login successfully',
      access_token: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET, 
        expiresIn: process.env.JWT_EXPIRATION, 
      })
    };
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    } catch {
      throw new UnauthorizedException();
    }
  }

}