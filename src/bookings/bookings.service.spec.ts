import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from './bookings.service';
import { ValidationException } from '../common/validation-exception';
import { Prisma, Studio, TimeSlot } from '@prisma/client';
import { PricesService } from '../common/prices.service';
import { MakeTimeSlotDto } from './dtos/make-booking.dto';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: PrismaService;
  const mockUserId = 'user-1';

  // Test data factories
  const createMockStudio = (id = 'studio-1', hourlyRate = 50): Studio => ({
    id,
    hourlyRate: new Prisma.Decimal(hourlyRate),
  });

  const createMockTimeSlot = (
    startTime = '2023-01-01T10:00:00Z',
    endTime = '2023-01-01T12:00:00Z',
    studioId = 'studio-1',
  ): TimeSlot => ({
    id: 1,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    studioId,
    price: new Prisma.Decimal(100),
    peopleCount: 2,
    bookingId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createBookingData = (
    studioId = 'studio-1',
    startTime = '2023-01-01T13:00:00Z',
    endTime = '2023-01-01T15:00:00Z',
    peopleCount = 2,
  ) => ({
    slots: [
      {
        studio: studioId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        peopleCount,
      },
    ],
  });

  // Common test setup
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

  // Helper functions to set up common testing scenarios
  const setupValidStudio = () => {
    (prisma.studio.findMany as jest.Mock).mockResolvedValue([
      createMockStudio(),
    ]);
  };

  const setupNoExistingTimeSlots = () => {
    (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);
  };

  const setupSuccessfulBookingCreation = () => {
    const timeSlot = createMockTimeSlot();
    (prisma.booking.create as jest.Mock).mockResolvedValue({
      id: 1,
      timeSlots: [timeSlot],
    });
  };

  describe('makeBooking', () => {
    describe('Studio validation', () => {
      it('should throw when studio does not exist', async () => {
        // Empty array means no studios were found
        (prisma.studio.findMany as jest.Mock).mockResolvedValue([]);
        const data = createBookingData('non-existent-studio');

        await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
          ValidationException,
        );
      });
    });

    describe('Time slot validation', () => {
      beforeEach(() => {
        setupValidStudio();
      });

      it('should throw when endTime is before startTime', async () => {
        setupNoExistingTimeSlots();
        const data = createBookingData(
          'studio-1',
          '2023-01-01T12:00:00Z',
          '2023-01-01T10:00:00Z', // end before start
        );

        await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
          ValidationException,
        );
      });

      it('should throw when endTime equals startTime', async () => {
        setupNoExistingTimeSlots();
        const data = createBookingData(
          'studio-1',
          '2023-01-01T10:00:00Z',
          '2023-01-01T10:00:00Z', // same time
        );

        await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
          ValidationException,
        );
      });
    });

    describe('Overlapping time slots', () => {
      beforeEach(() => {
        setupValidStudio();
      });

      it('should throw when new slot starts during existing slot', async () => {
        // Existing slot from 10:00 to 12:00
        (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
          createMockTimeSlot('2023-01-01T10:00:00Z', '2023-01-01T12:00:00Z'),
        ]);

        // New slot from 11:00 to 13:00 (overlaps)
        const data = createBookingData(
          'studio-1',
          '2023-01-01T11:00:00Z',
          '2023-01-01T13:00:00Z',
        );

        await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
          ValidationException,
        );
      });

      it('should throw when new slot is completely contained within existing slot', async () => {
        // Existing slot from 10:00 to 14:00
        (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
          createMockTimeSlot('2023-01-01T10:00:00Z', '2023-01-01T14:00:00Z'),
        ]);

        // New slot from 11:00 to 13:00 (contained within)
        const data = createBookingData(
          'studio-1',
          '2023-01-01T11:00:00Z',
          '2023-01-01T13:00:00Z',
        );

        await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
          ValidationException,
        );
      });
    });

    describe('Successful booking creation', () => {
      beforeEach(() => {
        setupValidStudio();
        setupNoExistingTimeSlots();
      });

      it('should create booking with correct prices when no overlaps', async () => {
        setupSuccessfulBookingCreation();

        const data = createBookingData();
        const result = await service.makeBooking(data, mockUserId);

        expect(result.timeSlots[0].price).toEqual(new Prisma.Decimal(100));
      });
    });
  });

  describe('Multiple slots booking', () => {
    const createMultiSlotBooking = (slots: MakeTimeSlotDto[]) => ({
      slots,
    });

    it('should allow multiple slots for the same studio', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([
        createMockStudio('studio-1', 500),
      ]);
      setupNoExistingTimeSlots();
      setupSuccessfulBookingCreation();

      const data = createMultiSlotBooking([
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
      ]);

      const result = await service.makeBooking(data, mockUserId);
      expect(result).toBeDefined();
    });

    it('should allow multiple slots for different studios', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([
        createMockStudio('studio-1', 500),
        createMockStudio('studio-2', 600),
      ]);
      setupNoExistingTimeSlots();
      (prisma.booking.create as jest.Mock).mockResolvedValue({
        id: 1,
        timeSlots: [],
      });

      const data = createMultiSlotBooking([
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
      ]);

      const result = await service.makeBooking(data, mockUserId);
      expect(result).toBeDefined();
    });

    it('should throw if one or more studios do not exist', async () => {
      (prisma.studio.findMany as jest.Mock).mockResolvedValue([
        createMockStudio('studio-1'),
      ]);

      const data = createMultiSlotBooking([
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
      ]);

      await expect(service.makeBooking(data, mockUserId)).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('validateStudios', () => {
    it('should pass validation for single studio with multiple slots', async () => {
      const studioIds = ['studio-1', 'studio-1']; // Duplicate studio IDs
      const mockStudios = [createMockStudio('studio-1')];

      (prisma.studio.findMany as jest.Mock).mockResolvedValue(mockStudios);

      const result = await service['validateStudios'](studioIds);
      expect(result).toEqual(mockStudios);
    });

    it('should pass validation for multiple unique studios', async () => {
      const studioIds = ['studio-1', 'studio-2'];
      const mockStudios = [
        createMockStudio('studio-1'),
        createMockStudio('studio-2'),
      ];

      (prisma.studio.findMany as jest.Mock).mockResolvedValue(mockStudios);

      const result = await service['validateStudios'](studioIds);
      expect(result).toEqual(mockStudios);
    });

    it('should throw if one or more studios do not exist', async () => {
      const studioIds = ['studio-1', 'studio-2'];
      const mockStudios = [createMockStudio('studio-1')]; // studio-2 is missing

      (prisma.studio.findMany as jest.Mock).mockResolvedValue(mockStudios);

      await expect(service['validateStudios'](studioIds)).rejects.toThrow(
        ValidationException,
      );
    });
  });
});
