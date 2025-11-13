import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CloudLogger } from '../logger/cloud.logger';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new (CloudLogger as any)(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn(`Access denied: token missing for request to ${request.url}`);
      throw new UnauthorizedException('Token is required!');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      request['user'] = payload;
      this.logger.log(`Access granted for user: ${payload.sub} to ${request.url}`);
      return true;
    }
    catch (err) {
      this.logger.warn(`Invalid or expired token for request to ${request.url} - ${err.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const cookieToken = request.cookies?.['access_token'];
    if (cookieToken) {
      this.logger.log(`Token extracted from cookie for request to ${request.url}`);
      return cookieToken;
    }

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      this.logger.log(`Token extracted from Authorization header for request to ${request.url}`);
      return token;
    }

    this.logger.warn(`No token found for request to ${request.url}`);
    return undefined;
  }
}
