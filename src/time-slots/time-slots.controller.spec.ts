import { Test, TestingModule } from '@nestjs/testing';
import { TimeSlotsController } from './time-slots.controller';

describe('TimeSlotsController', () => {
  let controller: TimeSlotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeSlotsController],
    }).compile();

    controller = module.get<TimeSlotsController>(TimeSlotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
