import { Module } from '@nestjs/common';
import { EmailAuthController } from './email-auth.controller';
import { EmailAuthService } from './email-auth.service';
import { UsersModule } from '../../users/users.module';
import { EmailTokenService } from './email-token.service';
import { EmailSenderService } from './email-sender.service';
import { PrismaService } from '../../prisma.service';
import { JwtTokensModule } from '../core/tokens/jwt-tokens.module';
import { EmailStrategy } from './email.strategy';

@Module({
  imports: [UsersModule, JwtTokensModule],
  exports: [],
  providers: [
    EmailAuthService,
    EmailTokenService,
    EmailSenderService,
    PrismaService,
    EmailStrategy,
  ],
  controllers: [EmailAuthController],
})
export class EmailAuthModule {}
