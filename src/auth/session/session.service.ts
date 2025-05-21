import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtTokensService } from '../core/tokens/jwt-tokens.service';

@Injectable()
export class SessionService {
  constructor(private jwtTokensService: JwtTokensService) {}

  async refreshTokens(oldRefreshToken: string) {
    // 1. Verify old refresh token
    const payload = this.jwtTokensService.verifyRefreshToken(oldRefreshToken);

    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedException('No user ID found');
    }

    // 2. Check DB validity
    await this.jwtTokensService.validateRefreshToken(oldRefreshToken);

    // 3. Generate NEW tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      this.jwtTokensService.generateJwt({ id: userId });

    // 4. Rotate tokens in DB
    await this.jwtTokensService.rotateRefreshToken(
      userId,
      oldRefreshToken, // Invalidate this
      newRefreshToken, // Store this
    );

    return { newAccessToken, newRefreshToken };
  }
}
