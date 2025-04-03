import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { EmailStrategy } from './email.strategy';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';
import { AuthController } from './auth.controller';
import { YandexStrategy } from './yandex.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [
    AuthService,
    TokenService,
    PrismaService,
    EmailService,
    EmailStrategy,
    JwtStrategy,
    YandexStrategy,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
