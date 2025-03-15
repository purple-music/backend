import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPricesDto {
  @ApiProperty()
  @IsISO8601({ strict: false })
  @Type(() => Date)
  from: Date;

  @ApiProperty()
  @IsISO8601({ strict: false })
  @Type(() => Date)
  to: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studioId: string;
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

export class PricesResponseDto {
  @ApiProperty({ type: () => [PricedTimeSlotDto] })
  prices: PricedTimeSlotDto[];
}
