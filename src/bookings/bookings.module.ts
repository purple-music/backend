import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { UsersService } from '../users/users.service';
import { BookingsController } from './bookings.controller';
import { PricesService } from '../common/prices.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BookingsService, UsersService, PricesService],
  controllers: [BookingsController],
})
export class BookingsModule {}
