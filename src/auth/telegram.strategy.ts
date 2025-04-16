import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthDataValidator } from '@telegram-auth/server';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  private validator: AuthDataValidator;

  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super();
    this.validator = new AuthDataValidator({
      botToken: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
    });
  }

  async validate(req: Request) {
    try {
      const telegramUser = await this.extractTelegramUser(req);

      return await this.authService.validateTelegramUser({
        id: telegramUser.id.toString(),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url,
      });
    } catch (err) {
      if (err instanceof Error) {
        throw new UnauthorizedException(err, 'Invalid Telegram authentication');
      }
      throw err;
    }
  }

  private async extractTelegramUser(req: Request) {
    const searchParams = new URLSearchParams(req.url.split('?')[1] || '');
    const dataMap = new Map(searchParams.entries());
    return await this.validator.validate(dataMap);
  }
}
