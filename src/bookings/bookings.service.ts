import { Injectable } from '@nestjs/common';
import { BookingDto, BookingFilterDto } from './dto/bookings';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async getBookings(filterDto: BookingFilterDto): Promise<BookingDto[]> {
    const {
      userId,
      studioId,
      startDate,
      endDate,
      peopleCount,
      page = 1,
      limit = 10,
    } = filterDto;

    return this.prisma.booking.findMany({
      where: {
        order: {
          userId: userId,
        },
        studioId: studioId,
        slotTime: {
          gte: startDate,
          lte: endDate,
        },
        peopleCount: peopleCount ? { gte: peopleCount } : undefined,
      },
      include: {
        order: true,
        studio: true,
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        slotTime: 'asc',
      },
    });
  }

  async getBookingsByUserId(userId: string): Promise<BookingDto[]> {
    return this.prisma.booking.findMany({
      where: {
        order: {
          userId: userId,
        },
      },
    });
  }

  // async getTransformedBookingsByUserId(
  //   userId: string,
  // ): Promise<Record<string, PersonalBooking[]>> {
  //   const currentDate = new Date();
  //   const bookings = await this.prisma.booking.findMany({
  //     where: {
  //       order: {
  //         userId: userId,
  //       },
  //       slotTime: {
  //         gte: currentDate,
  //       },
  //     },
  //   });
  //
  //   return this.transformBookings(bookings);
  // }

  // private transformBookings(
  //   bookings: Booking[],
  // ): Record<string, PersonalBooking[]> {
  //   const result: Record<string, PersonalBooking[]> = {};
  //
  //   bookings.forEach((booking) => {
  //     const day = booking.slotTime.toISOString().split('T')[0]; // Group by day
  //
  //     if (!result[day]) {
  //       result[day] = [];
  //     }
  //
  //     result[day].push({
  //       studio: booking.studioId as StudioId,
  //       time: booking.slotTime,
  //       people: booking.peopleCount,
  //       status: this.getStatus(booking),
  //       cost: this.calculateCost(booking),
  //     });
  //   });
  //
  //   return result;
  // }
  //
  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // private getStatus(booking: Booking): 'unpaid' | 'paid' | 'cancelled' {
  //   return 'paid'; // Example placeholder
  // }
  //
  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // private calculateCost(booking: Booking): number {
  //   return 100; // Example placeholder
  // }

  // async getCurrentBookingsByUserId(userId: string): Promise<Booking[]> {
  //   const currentDate = new Date();
  //   return this.prisma.booking.findMany({
  //     where: {
  //       order: {
  //         userId: userId,
  //       },
  //       slotTime: {
  //         gte: currentDate,
  //       },
  //     },
  //   });
  // }
  //
  // private getPrice(studioId: StudioId): number {
  //   switch (studioId) {
  //     case 'blue':
  //       return 600;
  //     case 'orange':
  //       return 500;
  //     case 'purple':
  //       return 500;
  //     default:
  //       return 400;
  //   }
  // }
  //
  // async getAvailableSlots(
  //   from: string,
  //   to: string,
  // ): Promise<Result<BookingSlotInfo[], string>> {
  //   const fromDate = new Date(from);
  //   const toDate = new Date(to);
  //
  //   if (fromDate >= toDate) {
  //     return { success: false, error: 'From date must be before to date' };
  //   }
  //
  //   try {
  //     const studiosWithBookings = await this.prisma.studio.findMany({
  //       include: {
  //         bookings: true,
  //       },
  //     });
  //
  //     const availableSlots: BookingSlotInfo[] = [];
  //
  //     for (const studio of studiosWithBookings) {
  //       const bookedSlots = studio.bookings
  //         .filter(
  //           (booking) =>
  //             booking.slotTime >= fromDate && booking.slotTime <= toDate,
  //         )
  //         .map((booking) => ({
  //           slotTime: booking.slotTime.getTime(),
  //         }));
  //
  //       // Generate hourly slots in a given range
  //       for (
  //         let hour = fromDate.getTime();
  //         hour <= toDate.getTime();
  //         hour += 60 * 60 * 1000
  //       ) {
  //         const slotTime = new Date(hour);
  //
  //         if (
  //           !bookedSlots.some((slot) => slot.slotTime === slotTime.getTime())
  //         ) {
  //           availableSlots.push({
  //             studioId: studio.id as StudioId,
  //             slotTime,
  //             price: this.getPrice(studio.id as StudioId),
  //           });
  //         }
  //       }
  //     }
  //
  //     // And make slots that are after NOW() unavailable
  //     const now = new Date();
  //     return {
  //       success: true,
  //       data: availableSlots.filter((slot) => slot.slotTime > now),
  //     };
  //   } catch (err) {
  //     console.error('Error fetching available slots:', err);
  //     return { success: false, error: 'Error fetching available slots' };
  //   }
  // }
}
