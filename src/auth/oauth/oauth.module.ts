import { Module } from '@nestjs/common';
import { TelegramAuthController } from './telegram-auth.controller';
import { YandexAuthController } from './yandex-auth.controller';
import { JwtTokensModule } from '../core/tokens/jwt-tokens.module';
import { UsersModule } from '../../users/users.module';
import { YandexStrategy } from './yandex.strategy';
import { TelegramStrategy } from './telegram.strategy';
import { TelegramAuthService } from './telegram-auth.service';
import { YandexAuthService } from './yandex-auth.service';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [JwtTokensModule, UsersModule],
  exports: [],
  controllers: [TelegramAuthController, YandexAuthController],
  providers: [
    TelegramStrategy,
    YandexStrategy,
    TelegramAuthService,
    YandexAuthService,
    PrismaService,
  ],
})
export class OAuthModule {}
