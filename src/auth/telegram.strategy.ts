import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthDataValidator } from '@telegram-auth/server';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { LoginTelegramRequestDto } from './dtos/login-telegram.dto';

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
    const body = req.body as LoginTelegramRequestDto;

    if (!body?.initData) {
      throw new UnauthorizedException('No initData in request body');
    }

    try {
      const telegramUser = await this.extractTelegramUser(body.initData);

      return await this.authService.validateTelegramUser({
        id: telegramUser.id.toString(),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url,
      });
    } catch (err) {
      if (err instanceof Error) {
        throw new UnauthorizedException(
          'Invalid Telegram authentication: ' + err.message,
        );
      }
      throw err;
    }
  }

  private async extractTelegramUser(initData: string) {
    console.log('TelegramStrategy.extractTelegramUser', initData);
    const searchParams = new URLSearchParams(initData || '');
    const dataMap = new Map(searchParams.entries());
    return await this.validator.validate(dataMap);
  }
}
