import { Prisma, Studio } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PricesService } from './prices.service';

describe('PricesService', () => {
  let service: PricesService;

  const mockStudio: Studio = {
    id: 'studio-1',
    hourlyRate: new Prisma.Decimal(50),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricesService],
    }).compile();
    service = module.get<PricesService>(PricesService);
  });

  describe('price calculation', () => {
    it('should calculate price based on duration and hourly rate', () => {
      const start = new Date('2023-01-01T10:00:00Z').toISOString();
      const end = new Date('2023-01-01T12:30:00Z').toISOString(); // 2.5 hours
      const price = service.calculatePrice(start, end, mockStudio);
      expect(price).toEqual(125); // 2.5 * 50
    });

    it('should handle decimal hourly rates', () => {
      const studioWithDecimalRate = {
        ...mockStudio,
        hourlyRate: new Prisma.Decimal(75.5),
      };
      const start = new Date('2023-01-01T10:00:00Z').toISOString();
      const end = new Date('2023-01-01T12:00:00Z').toISOString(); // 2 hours
      const price = service.calculatePrice(start, end, studioWithDecimalRate);
      expect(price).toEqual(151); // 2 * 75.5
    });
  });
});
