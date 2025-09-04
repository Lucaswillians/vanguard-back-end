import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RateLimiterService } from "./rate-limiter/rateLimiter.service";
import { CreateUserDto } from "src/User/dto/CreateUser.dto";


@Controller('/auth')
export class AuthController {
  @Inject()
  private readonly authService: AuthService;

  @Inject()
  private readonly rateLimiterService: RateLimiterService;

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(@Body() userData: CreateUserDto) {
    const { email, password } = userData;
    const ip = 'some-ip';
    const canLogin = await this.rateLimiterService.checkLoginAttempt(ip, email);

    if (!canLogin) {
      throw new UnauthorizedException('Too many login attempts, please try again later.');
    }

    return this.authService.signIn(email, password, ip);
  }
}