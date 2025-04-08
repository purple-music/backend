import { Test, TestingModule } from '@nestjs/testing';
import { FreeSlotsController } from './free-slots.controller';

describe('PricesController', () => {
  let controller: FreeSlotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FreeSlotsController],
    }).compile();

    controller = module.get<FreeSlotsController>(FreeSlotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
