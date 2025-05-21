import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { EmailAuthService } from './email-auth.service';

@Injectable()
export class EmailStrategy extends PassportStrategy(Strategy, 'email') {
  constructor(private emailAuthService: EmailAuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.emailAuthService.validateUserByEmail(
      email,
      password,
    );
    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }
    return user;
  }
}
