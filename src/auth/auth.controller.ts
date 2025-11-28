import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RateLimiterService } from "./rate-limiter/rateLimiter.service";
import { CreateUserDto } from "../User/dto/CreateUser.dto";
import { Request, Response } from "express";
import { Verify2FADto } from "./twoFactor/twoFactor.dto";

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
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    const { email, password, recaptchaToken } = userData;

    if (!recaptchaToken) {
      throw new UnauthorizedException("hCaptcha não verificado.");
    }

    const ip = req.ip;
    const canLogin = await this.rateLimiterService.checkLoginAttempt(ip as any, email);

    if (!canLogin) {
      throw new UnauthorizedException(
        "Too many login attempts, please try again later."
      );
    }

    const result: SignInResult = await this.authService.signIn(email, password, ip as any, recaptchaToken);

    function isTwoFactorRequired(res: SignInResult): res is SignIn2FA {
      return res.twoFactorRequired === true;
    }

    if (isTwoFactorRequired(result)) {
      return result; // Caso de 2FA
    }

    res.cookie("access_token", result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24h
    });

    return { message: result.message };
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify')
  async verify2fa(
    @Body() dto: Verify2FADto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.verify2FA(dto.email, dto.code);

    if (!result.access_token) {
      throw new UnauthorizedException("Código 2FA inválido.");
    }

    res.cookie("access_token", result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24h
    });

    return { message: result.message };
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
