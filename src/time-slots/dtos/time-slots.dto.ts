import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class TimeSlotDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  startTime: Date;
  @ApiProperty()
  endTime: Date;
  @ApiProperty()
  peopleCount: number;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty()
  studioId: string;
  @ApiProperty()
  bookingId: number;
  @ApiProperty({
    type: String,
    description: 'Time slot price as fixed decimal value',
  })
  @Transform(({ value }: { value: Prisma.Decimal }) => value.toNumber())
  price: Prisma.Decimal;
}

export class TimeSlotsDto {
  @ApiProperty({ type: () => [TimeSlotDto] })
  timeSlots: TimeSlotDto[];
}

export class TimeSlotFilterDto {
  @ApiPropertyOptional({
    description: 'User ID to filter time slots',
    example: '123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Studio IDs to filter time slots',
    example: ['studio-456', 'studio-789'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studioIds?: string[];

  @ApiPropertyOptional({
    description: 'Start date in ISO format',
    example: '2024-03-01',
  })
  @IsOptional()
  @IsISO8601({ strict: false })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format',
    example: '2024-03-31',
  })
  @IsOptional()
  @IsISO8601({ strict: false })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Number of people', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  peopleCount?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Limit for pagination', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
