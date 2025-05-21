import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtTokensModule } from './tokens/jwt-tokens.module';
import { EmailAuthModule } from '../email/email-auth.module';
import { OAuthModule } from '../oauth/oauth.module';
import { SessionModule } from '../session/session.module';

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
    JwtTokensModule,
    EmailAuthModule,
    OAuthModule,
    SessionModule,
    ConfigModule,
  ],
  exports: [],
})
export class AuthModule {}
