import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtTokensService } from './jwt-tokens.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private jwtTokenService: JwtTokensService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        if (req.cookies && req.cookies.refresh_token) {
          return req.cookies.refresh_token as string;
        }
        return null;
      },
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request) {
    return this.jwtTokenService.validateRefreshToken(
      req.cookies?.refresh_token as string | undefined,
    );
  }
}
