import { Injectable } from '@nestjs/common';
import { Prisma, Studio, User } from '@prisma/client';
import {
  BookingDto,
  MakeBookingDto,
  MakeTimeSlotDto,
} from './dtos/make-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationException } from '../common/validation-exception';
import { PricesService } from '../common/prices.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private pricesService: PricesService,
  ) {}

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

      const price = this.pricesService.calculatePrice(
        slot.startTime,
        slot.endTime,
        studio,
      );
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
}
