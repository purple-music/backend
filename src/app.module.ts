import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma.service';
import { BookingsModule } from './bookings/bookings.module';
import { BookingsService } from './bookings/bookings.service';

@Module({
  imports: [AuthModule, UsersModule, BookingsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, BookingsService],
})
export class AppModule {}
