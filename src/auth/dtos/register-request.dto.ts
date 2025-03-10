import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @IsEmail()
  @ApiProperty({ example: 'example@me.com' })
  email: string;
  @MinLength(6)
  @ApiProperty({ example: 'password' })
  password: string;
  @MinLength(2)
  @ApiProperty({ example: 'John Doe' })
  name: string;
}
