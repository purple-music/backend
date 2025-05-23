import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthDataValidator } from '@telegram-auth/server';
import { TelegramAuthService } from './telegram-auth.service';
import { ConfigService } from '@nestjs/config';
import { LoginTelegramRequestDto } from './dtos/login-telegram.dto';

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  private validator: AuthDataValidator;

  constructor(
    private telegramAuthService: TelegramAuthService,
    configService: ConfigService,
  ) {
    super();
    this.validator = new AuthDataValidator({
      botToken: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
    });
  }

  async validate(req: Request) {
    console.log('Telegram strategy validate called'); // <-- Add this
    const body = req.body as LoginTelegramRequestDto;

    if (!body?.initData) {
      console.log('No initData found'); // <-- Add this
      throw new UnauthorizedException('No initData in request body');
    }

    try {
      console.log('Extracting Telegram user'); // <-- Add this
      const telegramUser = await this.extractTelegramUser(body.initData);
      console.log('Telegram user extracted:', telegramUser); // <-- Add this

      return await this.telegramAuthService.validateTelegramUser({
        id: telegramUser.id.toString(),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url,
      });
    } catch (err) {
      console.error('Telegram validation error:', err); // <-- Add this
      if (err instanceof Error) {
        throw new UnauthorizedException(
          'Invalid Telegram authentication: ' + err.message,
        );
      }
      throw err;
    }
  }

  private async extractTelegramUser(initData: string) {
    const searchParams = new URLSearchParams(initData || '');
    const dataMap = new Map(searchParams.entries());
    return await this.validator.validate(dataMap);
  }
}
