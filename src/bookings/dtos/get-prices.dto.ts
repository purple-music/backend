import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class GetPricesDto {
  @ApiProperty()
  @IsISO8601({ strict: false })
  from: string;

  @ApiProperty()
  @IsISO8601({ strict: false })
  to: string;
}

export class PricedTimeSlotDto {
  @ApiProperty()
  startTime: Date;
  @ApiProperty()
  endTime: Date;
  @ApiProperty()
  price: number;
  @ApiProperty()
  studioId: string;
}

export class PricesStudioResponseDto {
  @ApiProperty({ type: () => [PricedTimeSlotDto] })
  prices: PricedTimeSlotDto[];

  @ApiProperty()
  studioId: string;
}
