import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccessTokenStrategy } from './access-token.strategy';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { JwtTokensService } from './jwt-tokens.service';
import { PrismaService } from '../../../prisma.service';
import { AccessTokenGuard } from './access-token.guard';
import { RefreshTokenGuard } from './refresh-token.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    JwtTokensService,
    PrismaService,

    AccessTokenStrategy,
    AccessTokenGuard,
    RefreshTokenStrategy,
    RefreshTokenGuard,
  ],
  exports: [JwtTokensService, AccessTokenGuard, RefreshTokenGuard],
})
export class JwtTokensModule {}
