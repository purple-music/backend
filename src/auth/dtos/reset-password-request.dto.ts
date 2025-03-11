import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordRequestDto {
  @IsEmail()
  @ApiProperty()
  email: string;
}
