import { Injectable } from '@nestjs/common';
import { Studio } from '@prisma/client';

@Injectable()
export class PricesService {
  calculatePrice(startTime: string, endTime: string, studio: Studio): number {
    const durationInHours =
      (new Date(endTime).getTime() - new Date(startTime).getTime()) /
      1000 /
      60 /
      60;
    return durationInHours * studio.hourlyRate.toNumber();
  }
}
