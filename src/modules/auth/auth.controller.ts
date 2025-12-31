import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  LoginResponseDto,
  Verify2FADto,
  Request2FACodeDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  RefreshTokenDto,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ThrottleCustom } from '../../common/decorators/throttle-custom.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ThrottleCustom({ limit: 3, ttl: 3600 }) // 3 per hour
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ThrottleCustom({ limit: 5, ttl: 60 }) // 5 per minute
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() _dto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const user = req.user as User;
    return this.authService.login(
      user,
      req.headers['user-agent'],
      req.ip,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser() user: CurrentUserPayload) {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    // We need to validate the refresh token manually since we're not using passport guard here
    const decoded = await this.authService['jwtService'].verifyAsync(dto.refreshToken, {
      secret: this.authService['configService'].get<string>('jwt.refreshSecret'),
    }).catch(() => null);

    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    return this.authService.refreshTokens(
      decoded.sub as string,
      decoded.sessionId as string,
      req.headers['user-agent'],
      req.ip,
    );
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ThrottleCustom({ limit: 3, ttl: 3600 }) // 3 per hour
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ThrottleCustom({ limit: 3, ttl: 3600 }) // 3 per hour
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @ThrottleCustom({ limit: 5, ttl: 600 }) // 5 per 10 minutes
  @ApiOperation({ summary: 'Verify 2FA code' })
  @ApiResponse({ status: 200, description: '2FA verified', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid code' })
  async verify2FA(
    @Body() dto: Verify2FADto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    return this.authService.verify2FA(
      dto,
      req.headers['user-agent'],
      req.ip,
    );
  }

  @Public()
  @Post('request-2fa-code')
  @HttpCode(HttpStatus.OK)
  @ThrottleCustom({ limit: 3, ttl: 600 }) // 3 per 10 minutes
  @ApiOperation({ summary: 'Request new 2FA code' })
  @ApiResponse({ status: 200, description: '2FA code sent' })
  async request2FACode(@Body() dto: Request2FACodeDto) {
    const userId = await this.authService['redisService'].get(
      `2fa_pending:${dto.tempToken}`,
    );

    if (!userId) {
      return { message: 'Invalid or expired session' };
    }

    await this.authService.generate2FACode(userId);
    return { message: '2FA code sent to your email' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getCurrentUser(user.id);
  }
}
