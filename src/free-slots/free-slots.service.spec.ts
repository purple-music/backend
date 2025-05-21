// import { Test, TestingModule } from '@nestjs/testing';
// import { FreeSlotsService } from './free-slots.service';
// import { PrismaService } from '../prisma.service';
// import { Prisma, Studio } from '@prisma/client';
// import { PricesService } from '../common/prices.service';
//
// describe('PricesService', () => {
//   let service: FreeSlotsService;
//   let prisma: PrismaService;
//
//   const mockStudio: Studio = {
//     id: 'studio-1',
//     hourlyRate: new Prisma.Decimal(50),
//   };
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         FreeSlotsService,
//         PricesService,
//         {
//           provide: PrismaService,
//           useValue: {
//             studio: {
//               findMany: jest.fn(),
//               findUnique: jest.fn(),
//             },
//             timeSlot: {
//               findMany: jest.fn(),
//             },
//             booking: {
//               create: jest.fn(),
//             },
//           },
//         },
//       ],
//     }).compile();
//
//     service = module.get<FreeSlotsService>(FreeSlotsService);
//     prisma = module.get<PrismaService>(PrismaService);
//   });
//
//   afterEach(() => {
//     jest.clearAllMocks();
//   });
//
//   describe('getFreeSlots', () => {
//     it('should return all hours as free when no busy slots', async () => {
//       (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
//       (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
//       (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);
//
//       const result = await service.getFreeSlots({
//         from: new Date('2023-01-01T10:00:00Z').toISOString(),
//         to: new Date('2023-01-01T14:00:00Z').toISOString(),
//         studioIds: ['studio-1'],
//       });
//
//       expect(result.freeSlots).toHaveLength(4);
//       expect(result.freeSlots[0].price).toEqual(50); // Hourly rate
//     });
//
//     it('should split free slots around busy slots', async () => {
//       (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
//       (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
//       (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
//         {
//           startTime: new Date('2023-01-01T11:00:00Z'),
//           endTime: new Date('2023-01-01T13:00:00Z'),
//         },
//       ]);
//
//       const result = await service.getFreeSlots({
//         from: new Date('2023-01-01T10:00:00Z').toISOString(),
//         to: new Date('2023-01-01T14:00:00Z').toISOString(),
//         studioIds: ['studio-1'],
//       });
//
//       expect(result.freeSlots).toHaveLength(2);
//       expect(result.freeSlots[0].endTime).toEqual(
//         new Date('2023-01-01T11:00:00Z'),
//       );
//       expect(result.freeSlots[1].startTime).toEqual(
//         new Date('2023-01-01T13:00:00Z'),
//       );
//     });
//
//     it('should handle partial hours at the end', async () => {
//       (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
//       (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
//       (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);
//
//       const result = await service.getFreeSlots({
//         from: new Date('2023-01-01T13:30:00Z').toISOString(),
//         to: new Date('2023-01-01T15:15:00Z').toISOString(),
//         studioIds: ['studio-1'],
//       });
//
//       expect(result.freeSlots).toHaveLength(2);
//       expect(result.freeSlots[0].endTime).toEqual(
//         new Date('2023-01-01T14:30:00Z'),
//       );
//       expect(result.freeSlots[1].endTime).toEqual(
//         new Date('2023-01-01T15:15:00Z'),
//       );
//     });
//
//     it('should handle busy slots at range edges', async () => {
//       (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
//       (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
//       (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
//         {
//           startTime: new Date('2023-01-01T10:00:00Z'),
//           endTime: new Date('2023-01-01T14:00:00Z'),
//         },
//       ]);
//
//       const result = await service.getFreeSlots({
//         from: new Date('2023-01-01T10:00:00Z').toISOString(),
//         to: new Date('2023-01-01T14:00:00Z').toISOString(),
//         studioIds: ['studio-1'],
//       });
//
//       expect(result.freeSlots).toHaveLength(0);
//     });
//   });
//
//   describe('getPrices - Free Slot Calculation', () => {
//     beforeEach(() => {
//       (prisma.studio.findUnique as jest.Mock).mockResolvedValue(mockStudio);
//       (prisma.studio.findMany as jest.Mock).mockResolvedValue([mockStudio]);
//     });
//
//     it('should return all hours as free when no busy slots', async () => {
//       (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([]);
//
//       const result = await service.getFreeSlots({
//         from: new Date('2023-01-01T10:00:00Z').toISOString(),
//         to: new Date('2023-01-01T14:00:00Z').toISOString(),
//         studioIds: ['studio-1'],
//       });
//
//       expect(result.freeSlots).toHaveLength(4); // 10-11, 11-12, 12-13, 13-14
//     });
//
//     it('should handle busy slots at the edges', async () => {
//       (prisma.timeSlot.findMany as jest.Mock).mockResolvedValue([
//         {
//           startTime: new Date('2023-01-01T10:00:00Z'),
//           endTime: new Date('2023-01-01T14:00:00Z'),
//         },
//       ]);
//
//       const result = await service.getFreeSlots({
//         from: new Date('2023-01-01T10:00:00Z').toISOString(),
//         to: new Date('2023-01-01T14:00:00Z').toISOString(),
//         studioIds: ['studio-1'],
//       });
//
//       expect(result.freeSlots).toHaveLength(0); // Entire range is busy
//     });
//   });
// });
