import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { BookingsService } from './bookings.service';
import { ValidationException } from '../common/validation-exception';
import { Prisma, Studio, TimeSlot } from '@prisma/client';
import { PricesService } from '../common/prices.service';

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
        PricesService,
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
            startTime: new Date('2023-01-01T10:00:00Z').toISOString(),
            endTime: new Date('2023-01-01T12:00:00Z').toISOString(),
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
            startTime: new Date('2023-01-01T11:00:00Z').toISOString(), // Overlaps with existing slot
            endTime: new Date('2023-01-01T13:00:00Z').toISOString(),
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
            startTime: new Date('2023-01-01T13:00:00Z').toISOString(),
            endTime: new Date('2023-01-01T15:00:00Z').toISOString(), // 2 hours
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
            startTime: new Date('2023-01-01T12:00:00Z').toISOString(),
            endTime: new Date('2023-01-01T10:00:00Z').toISOString(), // Invalid
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
            startTime: new Date('2023-01-01T10:00:00Z').toISOString(),
            endTime: new Date('2023-01-01T10:00:00Z').toISOString(), // Invalid
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
          startTime: new Date('2023-01-01T10:00:00Z').toISOString(),
          endTime: new Date('2023-01-01T12:00:00Z').toISOString(),
        },
      ]);

      const data = {
        slots: [
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T11:00:00Z').toISOString(), // Starts during existing slot
            endTime: new Date('2023-01-01T13:00:00Z').toISOString(),
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
            startTime: new Date('2023-01-01T11:00:00Z').toISOString(), // Contained within existing slot
            endTime: new Date('2023-01-01T13:00:00Z').toISOString(),
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
            startTime: new Date('2023-01-01T10:00:00Z').toISOString(),
            endTime: new Date('2023-01-01T12:00:00Z').toISOString(),
            peopleCount: 2,
          },
        ],
      };

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
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
            startTime: new Date('2023-01-01T10:00:00').toISOString(),
            endTime: new Date('2023-01-01T12:00:00').toISOString(),
            peopleCount: 2,
          },
          {
            studio: 'studio-1',
            startTime: new Date('2023-01-01T13:00:00').toISOString(),
            endTime: new Date('2023-01-01T14:00:00').toISOString(),
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
            startTime: new Date('2023-01-01T10:00:00').toISOString(),
            endTime: new Date('2023-01-01T12:00:00').toISOString(),
            peopleCount: 2,
          },
          {
            studio: 'studio-2',
            startTime: new Date('2023-01-01T13:00:00').toISOString(),
            endTime: new Date('2023-01-01T14:00:00').toISOString(),
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
            startTime: new Date('2023-01-01T10:00:00').toISOString(),
            endTime: new Date('2023-01-01T12:00:00').toISOString(),
            peopleCount: 2,
          },
          {
            studio: 'studio-2', // This studio doesn't exist
            startTime: new Date('2023-01-01T13:00:00').toISOString(),
            endTime: new Date('2023-01-01T14:00:00').toISOString(),
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
