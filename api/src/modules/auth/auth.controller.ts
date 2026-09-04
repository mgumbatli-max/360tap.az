import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService, type OtpAuthResponse, type OtpChallenge } from './auth.service';
import type { AuthResponse, AuthTokens, PublicUser } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import type { JwtPayload } from './types/jwt-payload.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto, @Req() req: Request): Promise<AuthResponse> {
    return this.auth.register(dto, this.ctx(req));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponse> {
    return this.auth.login(dto, this.ctx(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<AuthTokens> {
    return this.auth.refresh(dto.refreshToken, this.ctx(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload): Promise<PublicUser> {
    return this.auth.getMe(user.sub);
  }

  // -----------------------------------------------------------
  // Telefonla OTP girişi
  // -----------------------------------------------------------

  /** Ən sərt limit: hər sorğu SMS-dir, yəni PULDUR — spam birbaşa xərcə çevrilir. */
  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  sendOtp(@Body() dto: SendOtpDto): Promise<OtpChallenge> {
    return this.auth.sendOtp(dto.phone);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request): Promise<OtpAuthResponse> {
    return this.auth.verifyOtp(dto, this.ctx(req));
  }

  // -----------------------------------------------------------
  // E-poçt təsdiqi
  // -----------------------------------------------------------

  /** Auth tələb olunur (global JWT guard) — mektub yalnız öz hesabına göndərilir. */
  @Post('email/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  sendEmailVerification(@CurrentUser() user: JwtPayload): Promise<{ sent: boolean }> {
    return this.auth.sendEmailVerification(user.sub);
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ verified: true }> {
    return this.auth.verifyEmail(dto.token);
  }

  // -----------------------------------------------------------
  // Parolun bərpası
  // -----------------------------------------------------------

  /** Sərt limit: mektub göndərmə həm xərcdir, həm də başqasının qutusunu spamlamaq vasitəsidir. */
  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ sent: true }> {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ reset: true }> {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  private ctx(req: Request): { ip?: string; userAgent?: string } {
    return {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
  }
}
