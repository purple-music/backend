import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsISO8601, IsOptional } from 'class-validator';

export class FreeSlotsFilterDto {
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
