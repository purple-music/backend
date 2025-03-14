import { Module } from '@nestjs/common';
import { TimeSlotsController } from './time-slots.controller';
import { TimeSlotsService } from './time-slots.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TimeSlotsController],
  providers: [TimeSlotsService, PrismaService],
})
export class TimeSlotsModule {}
