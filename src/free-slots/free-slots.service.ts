import { Injectable } from '@nestjs/common';
import {
  FreeSlotDto,
  FreeSlotsFilterDto,
  FreeSlotsResponseDto,
} from './dtos/free-slots';
import { ValidationException } from '../common/validation-exception';
import { PrismaService } from '../prisma/prisma.service';
import { Studio } from '@prisma/client';
import { PricesService } from '../common/prices.service';

@Injectable()
export class FreeSlotsService {
  constructor(
    private prisma: PrismaService,
    private pricesService: PricesService,
  ) {}

  async getFreeSlots(data: FreeSlotsFilterDto): Promise<FreeSlotsResponseDto> {
    const { from, to, studioIds } = data;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Fetch only the required studios
    const studios = await this.prisma.studio.findMany({
      where: studioIds ? { id: { in: studioIds } } : undefined,
    });

    if (studioIds && studios.length !== studioIds.length) {
      const missingStudioIds = studioIds.filter(
        (id) => !studios.some((studio) => studio.id === id),
      );
      throw ValidationException.format(
        'studioIds',
        `One or more studios do not exist: ${missingStudioIds.join(', ')}`,
      );
    }

    // Fetch free slots for all fetched studios
    const freeSlots = await Promise.all(
      studios.map((studio) =>
        this.getFreeSlotsForStudio(fromDate, toDate, studio.id),
      ),
    );

    return {
      freeSlots: freeSlots.flat(),
    };
  }

  private async getFreeSlotsForStudio(
    from: Date,
    to: Date,
    studioId: string,
  ): Promise<FreeSlotDto[]> {
    const studio = await this.prisma.studio.findUnique({
      where: { id: studioId },
    });

    if (!studio) {
      throw ValidationException.format('studioId', 'Studio not found');
    }

    // Step 1: Fetch busy time slots
    const busyTimeSlots = await this.fetchBusyTimeSlots(studioId, from, to);

    // Step 2: Calculate free time slots in 1-hour intervals
    return this.calculateFreeSlots(busyTimeSlots, from, to, studio);
  }

  /**
   * Fetches all busy time slots for a studio within a given range.
   */
  private async fetchBusyTimeSlots(studioId: string, from: Date, to: Date) {
    return this.prisma.timeSlot.findMany({
      where: {
        studioId: studioId,
        OR: [
          { startTime: { gte: from, lt: to } }, // Slot starts within the range
          { endTime: { gt: from, lte: to } }, // Slot ends within the range
          { startTime: { lte: from }, endTime: { gte: to } }, // Slot completely overlaps the range
        ],
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Calculates free time slots in 1-hour intervals, avoiding busy slots.
   */
  private calculateFreeSlots(
    busyTimeSlots: { startTime: Date; endTime: Date }[],
    from: Date,
    to: Date,
    studio: Studio,
  ): FreeSlotDto[] {
    const freeTimeSlots: FreeSlotDto[] = [];
    let currentTime = from;

    for (const busySlot of busyTimeSlots) {
      // Add free slots before the busy slot
      this.addFreeSlotsBeforeBusySlot(
        currentTime,
        busySlot.startTime,
        to,
        studio,
        freeTimeSlots,
      );
      // Move currentTime to the end of the busy slot
      currentTime = busySlot.endTime;
    }

    // Add free slots after the last busy slot
    this.addFreeSlotsAfterLastBusySlot(currentTime, to, studio, freeTimeSlots);

    return freeTimeSlots;
  }

  /**
   * Adds free time slots in 1-hour intervals before a busy slot.
   */
  private addFreeSlotsBeforeBusySlot(
    currentTime: Date,
    busyStartTime: Date,
    rangeEnd: Date,
    studio: Studio,
    freeTimeSlots: FreeSlotDto[],
  ) {
    while (currentTime < busyStartTime) {
      const slotEndTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // Add 1 hour
      if (slotEndTime > busyStartTime) {
        // Adjust end time if it overlaps with the busy slot
        slotEndTime.setTime(busyStartTime.getTime());
      }
      if (slotEndTime <= rangeEnd) {
        freeTimeSlots.push(
          this.createFreeSlot(
            currentTime.toISOString(),
            slotEndTime.toISOString(),
            studio,
          ),
        );
      }
      currentTime = slotEndTime; // Move to the next hour
    }
  }

  /**
   * Adds free time slots in 1-hour intervals after the last busy slot.
   */
  private addFreeSlotsAfterLastBusySlot(
    currentTime: Date,
    rangeEnd: Date,
    studio: Studio,
    freeTimeSlots: FreeSlotDto[],
  ) {
    while (currentTime < rangeEnd) {
      const slotEndTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // Add 1 hour
      if (slotEndTime > rangeEnd) {
        // Adjust end time if it exceeds the range
        slotEndTime.setTime(rangeEnd.getTime());
      }
      freeTimeSlots.push(
        this.createFreeSlot(
          currentTime.toISOString(),
          slotEndTime.toISOString(),
          studio,
        ),
      );
      currentTime = slotEndTime; // Move to the next hour
    }
  }

  /**
   * Creates a FreeSlotDto object.
   */
  private createFreeSlot(
    startTime: string,
    endTime: string,
    studio: Studio,
  ): FreeSlotDto {
    return {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      price: this.pricesService.calculatePrice(startTime, endTime, studio),
      studioId: studio.id,
    };
  }
}
