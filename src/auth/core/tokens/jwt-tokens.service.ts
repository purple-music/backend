import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class JwtTokensService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Token generation
  generateJwt(user: { id: string; email?: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iss: this.configService.get<string>('JWT_ISSUER'),
      aud: this.configService.get<string>('JWT_AUDIENCE'),
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_TOKEN_EXPIRATION',
          '15m',
        ),
        secret: process.env.JWT_ACCESS_SECRET,
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_TOKEN_EXPIRATION',
          '7d',
        ),
        secret: process.env.JWT_REFRESH_SECRET,
      }),
    };
  }

  // Cookie management
  addTokensToCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh', // Only sent to refresh endpoint
    });
  }

  removeTokensFromCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  // Refresh token management
  async validateRefreshToken(token?: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const record = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!record || record.revokedAt) {
      throw new UnauthorizedException('Refresh token was revoked');
    }
  }

  async rotateRefreshToken(
    userId: string,
    oldRefreshToken: string,
    newRefreshToken: string,
  ) {
    const record = await this.prisma.refreshToken.create({
      data: { token: newRefreshToken, userId },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, token: { not: newRefreshToken } },
      data: { revokedAt: new Date(), replacedByToken: record.token },
    });
  }
}
