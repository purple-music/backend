import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => {
        if (req.cookies && req.cookies.access_token) {
          return req.cookies.access_token as string;
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: { sub: string; email: string | undefined }) {
    return {
      ...payload,
      refreshToken: req.cookies?.refresh_token as string | undefined,
    };
  }
}
