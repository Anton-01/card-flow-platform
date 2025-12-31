import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { UpdateUserDto, UpdatePasswordDto, UpdatePreferencesDto } from './dto';
import { comparePassword, hashPassword } from '../../common/utils/password.util';
import { encrypt } from '../../common/utils/crypto.util';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getProfile(userId: string) {
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
        updatedAt: true,
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
            trialEndsAt: true,
            currentPeriodEnd: true,
            plan: {
              select: {
                id: true,
                name: true,
                type: true,
                maxCards: true,
                maxEmployees: true,
              },
            },
          },
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        avatar: dto.avatar,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        timezone: true,
        language: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await comparePassword(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all other sessions (keep current one if we had session ID)
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { message: 'Password updated successfully. Please login again.' };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        timezone: dto.timezone,
        language: dto.language,
      },
      select: {
        id: true,
        timezone: true,
        language: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async enable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA enabled successfully' };
  }

  async disable2FA(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  async getSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions;
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Session deleted successfully' };
  }

  async deleteAllSessions(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { message: 'All sessions deleted successfully' };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        cards: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Soft delete - anonymize data (GDPR right to be forgotten)
    await this.prisma.$transaction(async (tx) => {
      // Anonymize user data
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@deleted.local`,
          firstName: 'Deleted',
          lastName: 'User',
          phone: null,
          avatar: null,
          passwordHash: '',
          emailVerifyToken: null,
          passwordResetToken: null,
          twoFactorCode: null,
          deletedAt: new Date(),
          isActive: false,
        },
      });

      // Delete all sessions
      await tx.session.deleteMany({
        where: { userId },
      });

      // Delete all cards
      await tx.card.deleteMany({
        where: { userId },
      });

      // Cancel subscription if exists
      if (user.subscription) {
        await tx.subscription.update({
          where: { id: user.subscription.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });
      }

      // Keep audit logs but anonymize
      await tx.auditLog.updateMany({
        where: { userId },
        data: {
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    this.logger.log(`User account deleted: ${userId}`);

    return { message: 'Account deleted successfully' };
  }
}
