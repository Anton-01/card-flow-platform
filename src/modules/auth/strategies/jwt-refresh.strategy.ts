import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtRefreshPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const refreshSecret = configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtRefreshPayload,
  ): Promise<{ userId: string; sessionId: string; refreshToken: string }> {
    const refreshToken = req.body?.refreshToken as string;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    // Verify the session exists and is valid
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session expired');
    }

    if (!session.user.isActive || session.user.deletedAt) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
      refreshToken,
    };
  }
}
