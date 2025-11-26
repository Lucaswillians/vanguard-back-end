import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RateLimiterService } from "./rate-limiter/rateLimiter.service";
import { CreateUserDto } from "../User/dto/CreateUser.dto";
import { Request, Response } from "express";

@Controller('/auth')
export class AuthController {
  @Inject()
  private readonly authService: AuthService;

  @Inject()
  private readonly rateLimiterService: RateLimiterService;

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(
    @Body() userData: CreateUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { email, password, recaptchaToken } = userData;

    if (!recaptchaToken) {
      throw new UnauthorizedException("hCaptcha não verificado.");
    }

    const ip = "some-ip"; // você pode pegar do req: req.ip
    const canLogin = await this.rateLimiterService.checkLoginAttempt(ip, email);

    if (!canLogin) {
      throw new UnauthorizedException(
        "Too many login attempts, please try again later."
      );
    }

    const token = await this.authService.signIn(email, password, ip, recaptchaToken);

    res.cookie("access_token", token.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24h
    });

    return {
      message: "Login realizado com sucesso!",
      accessToken: token.access_token,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logout realizado!' };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token = req.cookies['access_token'];
    if (!token) throw new UnauthorizedException();

    const payload = await this.authService.verifyToken(token);
    return { user: payload };
  }
}
