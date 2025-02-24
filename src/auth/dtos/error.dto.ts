import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'INVALID_TOKEN' })
  error: string;

  @ApiProperty({ example: 'The provided token is invalid or expired.' })
  message: string;
}
