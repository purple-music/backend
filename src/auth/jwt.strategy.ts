import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        if (req.cookies && req.cookies.token) {
          return req.cookies.token as string;
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  validate(payload: { email: string; sub: string }) {
    // We can add more properties to the payload (from Prisma for example)
    // TODO: research token revocation
    return { id: payload.sub, email: payload.email };
  }
}
