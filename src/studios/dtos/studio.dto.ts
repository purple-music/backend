import { Transform } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class StudioDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  @Transform(({ value }: { value: Prisma.Decimal }) => value.toNumber())
  hourlyRate: Prisma.Decimal;
}

export class StudiosResponseDto {
  @ApiProperty({ type: () => [StudioDto] })
  studios: StudioDto[];
}
