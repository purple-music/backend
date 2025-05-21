import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    example: 'Registration successful. Check your email for verification.',
  })
  message: string;
}
