import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';
import { BookingsController } from './bookings.controller';

@Module({
  providers: [BookingsService, PrismaService, UsersService],
  controllers: [BookingsController],
})
export class BookingsModule {}
