import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsISO8601, IsOptional } from 'class-validator';

export class PricesFilterDto {
  @ApiProperty({ description: 'Start time for the time slot range' })
  @IsISO8601({ strict: false })
  from: string;

  @ApiProperty({ description: 'End time for the time slot range' })
  @IsISO8601({ strict: false })
  to: string;

  @ApiProperty({
    description: 'Optional array of studio IDs to filter by',
    required: false,
  })
  @IsArray()
  @IsOptional()
  studioIds?: string[];
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
