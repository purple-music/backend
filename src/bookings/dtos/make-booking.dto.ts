import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TimeSlotDto } from '../../time-slots/dtos/time-slots';

export class MakeTimeSlotDto {
  @ApiProperty()
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  endTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  studio: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  peopleCount: number;
}

export class MakeBookingDto {
  @ApiProperty({ type: () => [MakeTimeSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MakeTimeSlotDto)
  slots: MakeTimeSlotDto[];
}

export class BookingDto {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty()
  @IsNotEmpty()
  updatedAt: Date;

  @ApiProperty({ type: () => [TimeSlotDto] })
  @IsArray()
  timeSlots: TimeSlotDto[];
}
