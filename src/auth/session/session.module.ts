import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { JwtTokensModule } from '../core/tokens/jwt-tokens.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [JwtTokensModule, UsersModule],
  exports: [],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
