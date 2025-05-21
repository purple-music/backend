import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-yandex';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { YandexAuthService } from './yandex-auth.service';

@Injectable()
export class YandexStrategy extends PassportStrategy(Strategy, 'yandex') {
  constructor(
    private yandexAuthService: YandexAuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('YANDEX_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('YANDEX_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('YANDEX_CALLBACK_URL'),
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    return await this.yandexAuthService.validateYandexUser(profile);
  }
}
