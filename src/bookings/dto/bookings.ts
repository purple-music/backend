import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

export type StudioId = 'blue' | 'orange' | 'purple';

export class BookingDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  slotTime: Date;
  @ApiProperty()
  peopleCount: number;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty()
  studioId: string;
  @ApiProperty()
  orderId: number;
}

export class BookingsResponse {
  @ApiProperty({ type: () => [BookingDto] })
  bookings: BookingDto[];
}

export class BookingFilterDto {
  @ApiPropertyOptional({
    description: 'User ID to filter bookings',
    example: '123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Studio ID to filter bookings',
    example: 'studio-456',
  })
  @IsOptional()
  @IsString()
  studioId?: string;

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

export class PersonalBooking {
  studio: StudioId;
  time: Date;
  people: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  cost: number;
}

export class BookingSlotInfo {
  studioId: StudioId;
  slotTime: Date;
  price: number;
}

export class GetAvailableSlotsDto {
  from: Date;
  to: Date;
}

export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
