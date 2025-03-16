import { Injectable } from '@nestjs/common';
import { Prisma, Studio, User } from '@prisma/client';
import {
  BookingDto,
  MakeBookingDto,
  MakeTimeSlotDto,
} from './dtos/make-booking.dto';
import { PrismaService } from '../prisma.service';
import { ValidationException } from '../common/validation-exception';
import {
  GetPricesDto,
  PricedTimeSlotDto,
  PricesStudioResponseDto,
} from './dtos/get-prices.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async makeBooking(
    data: MakeBookingDto,
    userId: User['id'],
  ): Promise<BookingDto> {
    const { slots } = data;

    // Check that to is after from
    this.validateTimeSlots(slots);

    // Check if all studios exist
    const studios = await this.validateStudios(
      slots.map((slot) => slot.studio),
    );

    // Check for overlapping bookings for each slot
    await this.validateNoOverlappingBookings(slots);

    // Calculate prices
    const pricedTimeSlots = this.createTimeSlotsWithPrices(slots, studios);

    // Create booking with time slots
    return this.createBookingWithTimeSlots(userId, pricedTimeSlots);
  }

  private validateTimeSlots(slots: MakeTimeSlotDto[]) {
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        throw ValidationException.format(
          'slots',
          'End time must be after start time',
        );
      }
    }

    return slots.length > 0;
  }

  private createBookingWithTimeSlots(
    userId: User['id'],
    timeSlots: Omit<Prisma.TimeSlotCreateManyInput, 'bookingId'>[],
  ) {
    return this.prisma.booking.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        timeSlots: {
          create: timeSlots,
        },
      },
      include: {
        timeSlots: true,
      },
    });
  }

  private createTimeSlotsWithPrices(
    slots: MakeTimeSlotDto[],
    studios: Studio[],
  ) {
    return slots.map((slot) => {
      const studio = studios.find((studio) => studio.id === slot.studio);

      if (!studio) {
        throw ValidationException.format('slots', 'Studio not found');
      }

      const price = this.calculatePrice(slot.startTime, slot.endTime, studio);
      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        peopleCount: slot.peopleCount,
        studioId: slot.studio,
        price,
      };
    });
  }

  private async validateStudios(studioIds: string[]): Promise<Studio[]> {
    // Remove duplicates from studioIds
    const uniqueStudioIds = [...new Set(studioIds)];

    const studios = await this.prisma.studio.findMany({
      where: {
        id: {
          in: uniqueStudioIds,
        },
      },
    });

    if (studios.length !== uniqueStudioIds.length) {
      const missingStudioIds = uniqueStudioIds.filter(
        (id) => !studios.some((studio) => studio.id === id),
      );
      throw ValidationException.format(
        'slots',
        `One or more studios do not exist: ${missingStudioIds.join(', ')}`,
      );
    }

    return studios;
  }

  private async validateNoOverlappingBookings(
    slots: Array<{
      studio: string;
      startTime: string;
      endTime: string;
    }>,
  ): Promise<void> {
    for (const slot of slots) {
      const overlappingBookings = await this.prisma.timeSlot.findMany({
        where: {
          studioId: slot.studio,
          startTime: { lt: slot.endTime },
          endTime: { gt: slot.startTime },
        },
      });

      if (overlappingBookings.length > 0) {
        throw ValidationException.format(
          'slots',
          `The slot from ${slot.startTime.toString()} to ${slot.endTime.toString()} for studio ${slot.studio} overlaps with an existing booking.`,
        );
      }
    }
  }

  async getPrices(
    data: GetPricesDto,
    studioId: string,
  ): Promise<PricesStudioResponseDto> {
    const from = new Date(data.from);
    const to = new Date(data.to);

    const studio = await this.prisma.studio.findUnique({
      where: {
        id: studioId,
      },
    });

    if (!studio) {
      throw ValidationException.format('studioId', 'Studio not found');
    }

    // Step 1: Fetch busy time slots
    const busyTimeSlots = await this.fetchBusyTimeSlots(studioId, from, to);

    // Step 2: Calculate free time slots in 1-hour intervals
    const freeTimeSlots = this.calculateFreeTimeSlots(
      busyTimeSlots,
      from,
      to,
      studio,
    );

    // Step 3: Return the free time slots
    return {
      prices: freeTimeSlots,
      studioId: studioId,
    };
  }

  async getAllPrices(data: GetPricesDto): Promise<PricesStudioResponseDto[]> {
    return Promise.all(
      (await this.prisma.studio.findMany()).map((studio) =>
        this.getPrices(data, studio.id),
      ),
    );
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
  private calculateFreeTimeSlots(
    busyTimeSlots: { startTime: Date; endTime: Date }[],
    from: Date,
    to: Date,
    studio: Studio,
  ): PricedTimeSlotDto[] {
    const freeTimeSlots: PricedTimeSlotDto[] = [];
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
    freeTimeSlots: PricedTimeSlotDto[],
  ) {
    while (currentTime < busyStartTime) {
      const slotEndTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // Add 1 hour
      if (slotEndTime > busyStartTime) {
        // Adjust end time if it overlaps with the busy slot
        slotEndTime.setTime(busyStartTime.getTime());
      }
      if (slotEndTime <= rangeEnd) {
        freeTimeSlots.push(
          this.createPricedTimeSlot(
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
    freeTimeSlots: PricedTimeSlotDto[],
  ) {
    while (currentTime < rangeEnd) {
      const slotEndTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // Add 1 hour
      if (slotEndTime > rangeEnd) {
        // Adjust end time if it exceeds the range
        slotEndTime.setTime(rangeEnd.getTime());
      }
      freeTimeSlots.push(
        this.createPricedTimeSlot(
          currentTime.toISOString(),
          slotEndTime.toISOString(),
          studio,
        ),
      );
      currentTime = slotEndTime; // Move to the next hour
    }
  }

  /**
   * Creates a PricedTimeSlotDto object.
   */
  private createPricedTimeSlot(
    startTime: string,
    endTime: string,
    studio: Studio,
  ): PricedTimeSlotDto {
    return {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      price: this.calculatePrice(startTime, endTime, studio),
      studioId: studio.id,
    };
  }

  private calculatePrice(
    startTime: string,
    endTime: string,
    studio: Studio,
  ): number {
    const durationInHours =
      (new Date(endTime).getTime() - new Date(startTime).getTime()) /
      1000 /
      60 /
      60;
    return durationInHours * this.getHourlyRate(studio).toNumber();
  }

  private getHourlyRate(studio: Studio): Prisma.Decimal {
    return studio.hourlyRate;
  }
}
