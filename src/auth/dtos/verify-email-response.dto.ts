import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({
    example: 'abcd1234',
    description: 'The email verification token',
    required: true,
  })
  token: string;
}
