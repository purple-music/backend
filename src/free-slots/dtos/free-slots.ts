import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FreeSlotsFilterDto {
  @ApiProperty({
    description: 'Start time for the time slot range',
    type: String,
    example: '2025-04-20T21:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date) // Required for class-transformer to parse string -> Date
  from: Date;

  @ApiProperty({
    description: 'End time for the time slot range',
    type: String,
    example: '2025-04-21T21:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date) // Required for class-transformer to parse string -> Date
  to: Date;

  @ApiProperty({
    description: 'Optional array of studio IDs to filter by',
    required: false,
  })
  @IsArray()
  @IsOptional()
  studioIds?: string[];
}

export class FreeSlotDto {
  @ApiProperty()
  startTime: Date;
  @ApiProperty()
  endTime: Date;
  @ApiProperty()
  price: number;
  @ApiProperty()
  studioId: string;
}

export class FreeSlotsResponseDto {
  @ApiProperty({ type: () => [FreeSlotDto] })
  freeSlots: FreeSlotDto[];
}
