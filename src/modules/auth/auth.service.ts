import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, PlanType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  RegisterDto,
  LoginResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  Verify2FADto,
} from './dto';
import {
  hashPassword,
  comparePassword,
} from '../../common/utils/password.util';
import {
  generateSecureToken,
  generateNumericCode,
  encrypt,
  decrypt,
  hashToken,
} from '../../common/utils/crypto.util';
import { JwtPayload, JwtRefreshPayload } from '../../common/interfaces/jwt-payload.interface';
import { TRIAL_DURATION_DAYS } from '../../common/constants/plans.constant';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string; userId: string }> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password);

    // Generate email verification token
    const verifyToken = generateSecureToken();
    const verifyTokenHash = hashToken(verifyToken);

    // Get Basic plan
    const basicPlan = await this.prisma.plan.findUnique({
      where: { type: PlanType.BASIC },
    });

    if (!basicPlan) {
      throw new BadRequestException('Basic plan not found. Please run database seeds.');
    }

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    // Create user with subscription
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        timezone: dto.timezone || 'America/Mexico_City',
        language: dto.language || 'es',
        role: UserRole.INDIVIDUAL,
        emailVerifyToken: encrypt(verifyTokenHash),
        emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        subscription: {
          create: {
            planId: basicPlan.id,
            status: 'TRIAL',
            trialEndsAt,
          },
        },
      },
    });

    // TODO: Send verification email via queue
    this.logger.log(`User registered: ${user.email}, verification token: ${verifyToken}`);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponseDto> {
    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      const tempToken = generateSecureToken();

      // Store temp token in Redis (5 minutes)
      await this.redisService.set(
        `2fa_pending:${tempToken}`,
        user.id,
        5 * 60,
      );

      // Generate and send 2FA code
      await this.generate2FACode(user.id);

      return {
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        tokenType: 'Bearer',
        requires2FA: true,
        tempToken,
      };
    }

    // Generate tokens
    return this.generateTokens(user, userAgent, ipAddress);
  }

  async verify2FA(dto: Verify2FADto, userAgent?: string, ipAddress?: string): Promise<LoginResponseDto> {
    // Get user ID from temp token
    const userId = await this.redisService.get(`2fa_pending:${dto.tempToken}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify 2FA code
    if (!user.twoFactorCode || !user.twoFactorExpires) {
      throw new UnauthorizedException('No 2FA code found. Please request a new one.');
    }

    const decryptedCode = decrypt(user.twoFactorCode);

    if (decryptedCode !== dto.code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (new Date() > user.twoFactorExpires) {
      throw new UnauthorizedException('Verification code has expired');
    }

    // Clear 2FA code and temp token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    await this.redisService.del(`2fa_pending:${dto.tempToken}`);

    // Generate tokens
    return this.generateTokens(user, userAgent, ipAddress);
  }

  async generate2FACode(userId: string): Promise<void> {
    const code = generateNumericCode(6);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorCode: encrypt(code),
        twoFactorExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // TODO: Send 2FA code via email through queue
    this.logger.log(`2FA code generated for user ${userId}: ${code}`);
  }

  async refreshTokens(
    userId: string,
    sessionId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Delete old session
    await this.prisma.session.delete({
      where: { id: sessionId },
    }).catch(() => {
      // Session might already be deleted
    });

    // Generate new tokens
    return this.generateTokens(user, userAgent, ipAddress);
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.prisma.session.delete({
        where: { id: sessionId },
      }).catch(() => {
        // Session might already be deleted
      });
    } else {
      // Logout from all sessions
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = hashToken(token);

    const user = await this.prisma.user.findFirst({
      where: {
        isEmailVerified: false,
      },
    });

    if (!user || !user.emailVerifyToken) {
      throw new BadRequestException('Invalid verification token');
    }

    // Decrypt and compare
    const storedHash = decrypt(user.emailVerifyToken);

    if (storedHash !== tokenHash) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerifyExpires && new Date() > user.emailVerifyExpires) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account exists, a verification email has been sent.' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    // Generate new token
    const verifyToken = generateSecureToken();
    const verifyTokenHash = hashToken(verifyToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: encrypt(verifyTokenHash),
        emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // TODO: Send verification email via queue
    this.logger.log(`Verification email resent to ${email}, token: ${verifyToken}`);

    return { message: 'If an account exists, a verification email has been sent.' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account exists, a password reset email has been sent.' };
    }

    const resetToken = generateSecureToken();
    const resetTokenHash = hashToken(resetToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: encrypt(resetTokenHash),
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send password reset email via queue
    this.logger.log(`Password reset requested for ${dto.email}, token: ${resetToken}`);

    return { message: 'If an account exists, a password reset email has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = hashToken(dto.token);

    // Find user with valid reset token
    const users = await this.prisma.user.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { gt: new Date() },
      },
    });

    let matchedUser: User | null = null;

    for (const user of users) {
      if (!user.passwordResetToken) continue;
      const storedHash = decrypt(user.passwordResetToken);
      if (storedHash === tokenHash) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    const passwordHash = await hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Invalidate all sessions
    await this.prisma.session.deleteMany({
      where: { userId: matchedUser.id },
    });

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        timezone: true,
        language: true,
        lastLoginAt: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        employeeOf: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            plan: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponseDto> {
    // Create session
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: generateSecureToken(),
        refreshToken: generateSecureToken(),
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Generate JWT payload
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,
      employeeOfId: user.employeeOfId || undefined,
      departmentId: user.departmentId || undefined,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      sessionId: session.id,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    // Update session with actual tokens
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: accessToken,
        refreshToken,
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer',
      requires2FA: false,
    };
  }
}
