import { Module } from '@nestjs/common';
import { FreeSlotsController } from './free-slots.controller';
import { FreeSlotsService } from './free-slots.service';
import { PricesService } from '../common/prices.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FreeSlotsController],
  providers: [FreeSlotsService, PricesService],
})
export class FreeSlotsModule {}
