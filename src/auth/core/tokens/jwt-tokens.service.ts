import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtTokensService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });
  }

  /**
   * Sign a new pair of access and refresh tokens
   * Don't forget to add refresh token to DB! Otherwise, it will be considered revoked
   */
  generateTokenPair(user: { id: string; email?: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iss: this.configService.get<string>('JWT_ISSUER'),
      aud: this.configService.get<string>('JWT_AUDIENCE'),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_TOKEN_EXPIRATION',
        '15m',
      ),
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_TOKEN_EXPIRATION',
        '7d',
      ),
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generates new JWT tokens AND persists the refresh token
   * Use only for initial authentication (login)
   */
  async createLoginSession(user: { id: string; email?: string }) {
    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokenPair(user);

    // Add refreshToken to the database
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    return {
      accessToken,
      refreshToken,
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
      path: '/', // We had to change this to '/' because we need to track refresh tokens in middleware
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
      include: { user: true },
    });

    if (!record) {
      throw new UnauthorizedException('No such refresh token');
    }
    if (record.revokedAt) {
      throw new UnauthorizedException('Refresh token was revoked');
    }

    return {
      id: record.user.id,
      email: record.user.email,
    };
  }

  async rotateTokens(
    userId: string,
    oldRefreshToken: string,
    newRefreshToken: string,
  ) {
    // 1. First revoke old tokens (atomic operation)
    await this.prisma.$transaction([
      // Mark old tokens as revoked
      this.prisma.refreshToken.updateMany({
        where: {
          userId,
          token: oldRefreshToken, // Specific token being rotated
          revokedAt: null, // Only unrevoked tokens
        },
        data: {
          revokedAt: new Date(),
          replacedByToken: newRefreshToken,
        },
      }),

      // Create new token
      this.prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId,
        },
      }),
    ]);
  }
}
