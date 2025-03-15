import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma.service';
import { TimeSlotsModule } from './time-slots/time-slots.module';
import { TimeSlotsService } from './time-slots/time-slots.service';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [AuthModule, UsersModule, TimeSlotsModule, BookingsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, TimeSlotsService],
})
export class AppModule {}
