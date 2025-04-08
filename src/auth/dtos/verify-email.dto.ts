import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abcd1234',
    description: 'The email verification token',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}
