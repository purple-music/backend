import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthDataValidator, urlStrToAuthDataMap } from '@telegram-auth/server';

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  private validator: AuthDataValidator;

  constructor() {
    super();
    this.validator = new AuthDataValidator({
      botToken: process.env.TELEGRAM_BOT_TOKEN,
    });
  }

  async validate(req: Request) {
    const data = urlStrToAuthDataMap(req.url);
    try {
      const user = await this.validator.validate(data);
      return {
        id: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        photoUrl: user.photo_url,
      };
    } catch (err) {
      if (err instanceof Error) {
        throw new UnauthorizedException(err, 'Invalid Telegram authentication');
      }
      throw err;
    }
  }
}
