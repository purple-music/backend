import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { BookingsService } from './bookings.service';
import { ValidationException } from '../common/validation-exception';
import { Prisma, Studio, TimeSlot } from '@prisma/client';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: PrismaService;

  const mockStudio: Studio = {
    id: 'studio-1',
    hourlyRate: new Prisma.Decimal(50),
  };

  // From 10:00 to 12:00
  const mockTimeSlots: TimeSlot[] = [
    {
      id: 1,
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T12:00:00Z'),
      studioId: 'studio-1',
      price: new Prisma.Decimal(100),
      peopleCount: 2,
      bookingId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockUserId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: {
            studio: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            timeSlot: {
              findMany: jest.fn(),
            },
            booking: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('makeBooking', () => {
    it('should throw if studio does not exist', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([]);

      const data = {
        slots: [
          {
            studio: 'non-existent-studio',
            startTime: new Date('2023-01-01T10:00:00Z'),
            endTime: new Date('2023-01-01T12:00:00Z'),
            peopleCount: 2,
          },
        ],
      };

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw if time slot overlaps with existing booking', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue(mockTimeSlots);

      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T11:00:00Z'), // Overlaps with existing slot
            endTime: new Date('2023-01-01T13:00:00Z'),
            peopleCount: 2,
          },
        ],
      };

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should create booking with correct prices when no overlaps', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.booking.create as jest.Mock).mockResolvedValue({
        id: 1,
        timeSlots: mockTimeSlots,
      });

      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T13:00:00Z'),
            endTime: new Date('2023-01-01T15:00:00Z'), // 2 hours
            peopleCount: 2,
          },
        ],
      };

      const result = await service.makeBooking(data, mockUserId);
      expect(result.timeSlots[0].price).toEqual(new Prisma.Decimal(100)); // 2 hours * 50/hour
    });
  });

  describe('makeBooking - Time Slot Validation', () => {
    it('should throw if endTime is before startTime', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);
      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T12:00:00Z'),
            endTime: new Date('2023-01-01T10:00:00Z'), // Invalid
            peopleCount: 2,
          },
        ],
      };

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw if endTime equals startTime', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);
      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T10:00:00Z'),
            endTime: new Date('2023-01-01T10:00:00Z'), // Invalid
            peopleCount: 2,
          },
        ],
      };

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('makeBooking - Overlap Scenarios', () => {
    beforeEach(() => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
    });

    it('should throw if new slot starts during existing slot', async () => {
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T12:00:00Z'),
        },
      ]);

      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T11:00:00Z'), // Starts during existing slot
            endTime: new Date('2023-01-01T13:00:00Z'),
            peopleCount: 2,
          },
        ],
      };

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw if new slot is completely contained within existing slot', async () => {
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T14:00:00Z'),
        },
      ]);

      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T11:00:00Z'), // Contained within existing slot
            endTime: new Date('2023-01-01T13:00:00Z'),
            peopleCount: 2,
          },
        ],
      };

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('makeBooking - Studio Validation', () => {
    it('should throw if studio does not exist', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([]);

      const data = {
        slots: [
          {
            studio: 'non-existent-studio',
            startTime: new Date('2023-01-01T10:00:00Z'),
            endTime: new Date('2023-01-01T12:00:00Z'),
            peopleCount: 2,
          },
        ],
      };

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('getPrices', () => {
    it('should return all hours as free when no busy slots', async () => {
      (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getPrices(
        {
          from: new Date('2023-01-01T10:00:00Z').toISOString(),
          to: new Date('2023-01-01T14:00:00Z').toISOString(),
        },
        'studio-1',
      );

      expect(result.prices).toHaveLength(4);
      expect(result.prices[0].price).toEqual(50); // Hourly rate
    });

    it('should split free slots around busy slots', async () => {
      (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        {
          startTime: new Date('2023-01-01T11:00:00Z'),
          endTime: new Date('2023-01-01T13:00:00Z'),
        },
      ]);

      const result = await service.getPrices(
        {
          from: new Date('2023-01-01T10:00:00Z').toISOString(),
          to: new Date('2023-01-01T14:00:00Z').toISOString(),
        },
        'studio-1',
      );

      expect(result.prices).toHaveLength(2);
      expect(result.prices[0].endTime).toEqual(
        new Date('2023-01-01T11:00:00Z'),
      );
      expect(result.prices[1].startTime).toEqual(
        new Date('2023-01-01T13:00:00Z'),
      );
    });

    it('should handle partial hours at the end', async () => {
      (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getPrices(
        {
          from: new Date('2023-01-01T13:30:00Z').toISOString(),
          to: new Date('2023-01-01T15:15:00Z').toISOString(),
        },
        'studio-1',
      );

      expect(result.prices).toHaveLength(2);
      expect(result.prices[0].endTime).toEqual(
        new Date('2023-01-01T14:30:00Z'),
      );
      expect(result.prices[1].endTime).toEqual(
        new Date('2023-01-01T15:15:00Z'),
      );
    });

    it('should handle busy slots at range edges', async () => {
      (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T14:00:00Z'),
        },
      ]);

      const result = await service.getPrices(
        {
          from: new Date('2023-01-01T10:00:00Z').toISOString(),
          to: new Date('2023-01-01T14:00:00Z').toISOString(),
        },
        'studio-1',
      );

      expect(result.prices).toHaveLength(0);
    });
  });

  describe('getPrices - Free Slot Calculation', () => {
    beforeEach(() => {
      (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
    });

    it('should return all hours as free when no busy slots', async () => {
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getPrices(
        {
          from: new Date('2023-01-01T10:00:00Z').toISOString(),
          to: new Date('2023-01-01T14:00:00Z').toISOString(),
        },
        'studio-1',
      );

      expect(result.prices).toHaveLength(4); // 10-11, 11-12, 12-13, 13-14
    });

    it('should handle busy slots at the edges', async () => {
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
        {
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T14:00:00Z'),
        },
      ]);

      const result = await service.getPrices(
        {
          from: new Date('2023-01-01T10:00:00Z').toISOString(),
          to: new Date('2023-01-01T14:00:00Z').toISOString(),
        },
        'studio-1',
      );

      expect(result.prices).toHaveLength(0); // Entire range is busy
    });
  });

  describe('price calculation', () => {
    it('should calculate price based on duration and hourly rate', () => {
      const start = new Date('2023-01-01T10:00:00Z');
      const end = new Date('2023-01-01T12:30:00Z'); // 2.5 hours
      const price = service['calculatePrice'](start, end, mockStudio);
      expect(price).toEqual(125); // 2.5 * 50
    });

    it('should handle decimal hourly rates', () => {
      const studioWithDecimalRate = {
        ...mockStudio,
        hourlyRate: new Prisma.Decimal(75.5),
      };
      const start = new Date('2023-01-01T10:00:00Z');
      const end = new Date('2023-01-01T12:00:00Z'); // 2 hours
      const price = service['calculatePrice'](
        start,
        end,
        studioWithDecimalRate,
      );
      expect(price).toEqual(151); // 2 * 75.5
    });
  });

  describe('validateStudios', () => {
    it('should pass validation for single studio with multiple slots', async () => {
      const studioIds = ['studio-1', 'studio-1']; // Duplicate studio IDs
      const mockStudios = [{ id: 'studio-1' }];

      (prisma.studio.findMany as jest.Mock).mockResolvedValue(mockStudios);

      const result = await service['validateStudios'](studioIds);
      expect(result).toEqual(mockStudios);
    });

    it('should pass validation for multiple unique studios', async () => {
      const studioIds = ['studio-1', 'studio-2'];
      const mockStudios = [{ id: 'studio-1' }, { id: 'studio-2' }];

      (prisma.studio.findMany as jest.Mock).mockResolvedValue(mockStudios);

      const result = await service['validateStudios'](studioIds);
      expect(result).toEqual(mockStudios);
    });

    it('should throw if one or more studios do not exist', async () => {
      const studioIds = ['studio-1', 'studio-2'];
      const mockStudios = [{ id: 'studio-1' }]; // studio-2 is missing

      (prisma.studio.findMany as jest.Mock).mockResolvedValue(mockStudios);

      await expect(service['validateStudios'](studioIds)).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('makeBooking, multiple slots', () => {
    beforeEach(() => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([
        { id: 'studio-1', hourlyRate: new Prisma.Decimal(500.0) },
      ]);
      (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.booking.create as jest.Mock).mockResolvedValue({
        id: 1,
        timeSlots: [],
      });
    });

    it('should allow multiple slots for the same studio', async () => {
      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T10:00:00'),
            endTime: new Date('2023-01-01T12:00:00'),
            peopleCount: 2,
          },
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T13:00:00'),
            endTime: new Date('2023-01-01T14:00:00'),
            peopleCount: 2,
          },
        ],
      };

      const result = await service.makeBooking(data, mockUserId);
      expect(result).toBeDefined();
    });

    it('should allow multiple slots for different studios', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([
        { id: 'studio-1', hourlyRate: new Prisma.Decimal(500.0) },
        { id: 'studio-2', hourlyRate: new Prisma.Decimal(600.0) },
      ]);

      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T10:00:00'),
            endTime: new Date('2023-01-01T12:00:00'),
            peopleCount: 2,
          },
          {
            studio: 'studio-2',
            startTime: new Date('2023-01-01T13:00:00'),
            endTime: new Date('2023-01-01T14:00:00'),
            peopleCount: 2,
          },
        ],
      };

      const result = await service.makeBooking(data, mockUserId);
      expect(result).toBeDefined();
    });

    it('should throw if one or more studios do not exist', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([
        { id: 'studio-1' },
      ]);

      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T10:00:00'),
            endTime: new Date('2023-01-01T12:00:00'),
            peopleCount: 2,
          },
          {
            studio: 'studio-2', // This studio doesn't exist
            startTime: new Date('2023-01-01T13:00:00'),
            endTime: new Date('2023-01-01T14:00:00'),
            peopleCount: 2,
          },
        ],
      };

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
    });
  });
});
