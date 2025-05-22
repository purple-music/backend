import { Module } from '@nestjs/common';
import { TelegramAuthController } from './telegram-auth.controller';
import { YandexAuthController } from './yandex-auth.controller';
import { JwtTokensModule } from '../core/tokens/jwt-tokens.module';
import { UsersModule } from '../../users/users.module';
import { YandexStrategy } from './yandex.strategy';
import { TelegramStrategy } from './telegram.strategy';
import { TelegramAuthService } from './telegram-auth.service';
import { YandexAuthService } from './yandex-auth.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [JwtTokensModule, UsersModule, PrismaModule],
  exports: [],
  controllers: [TelegramAuthController, YandexAuthController],
  providers: [
    TelegramStrategy,
    YandexStrategy,
    TelegramAuthService,
    YandexAuthService,
  ],
})
export class OAuthModule {}
