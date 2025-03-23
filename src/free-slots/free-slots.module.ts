import { Module } from '@nestjs/common';
import { FreeSlotsController } from './free-slots.controller';
import { FreeSlotsService } from './free-slots.service';
import { PrismaService } from '../prisma.service';
import { PricesService } from '../common/prices.service';

@Module({
  controllers: [FreeSlotsController],
  providers: [FreeSlotsService, PrismaService, PricesService],
})
export class FreeSlotsModule {}
