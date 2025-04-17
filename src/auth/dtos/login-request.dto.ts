import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'example@me.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password' })
  password: string;
}
