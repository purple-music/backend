import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { JwtTokensService } from '../core/tokens/jwt-tokens.service';

@Injectable()
export class SessionService {
  constructor(
    private jwtService: JwtService,
    private tokenService: JwtTokensService,
  ) {}

  async refreshTokens(oldRefreshToken: string) {
    // 1. Verify old refresh token
    const payload = this.jwtService.verify<JwtPayload>(oldRefreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedException('No user ID found');
    }

    // 2. Check DB validity
    await this.tokenService.validateRefreshToken(oldRefreshToken);

    // 3. Generate NEW tokens
    const newAccessToken = this.jwtService.sign(
      { sub: payload.sub },
      { expiresIn: '15m', secret: process.env.JWT_ACCESS_SECRET },
    );

    const newRefreshToken = this.jwtService.sign(
      { sub: payload.sub },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
    );

    // 4. Rotate tokens in DB
    await this.tokenService.rotateRefreshToken(
      userId,
      oldRefreshToken, // Invalidate this
      newRefreshToken, // Store this
    );

    return { newAccessToken, newRefreshToken };
  }
}
