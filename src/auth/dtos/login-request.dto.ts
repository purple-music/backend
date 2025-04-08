import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({ example: 'example@me.com' })
  email: string;

  @ApiProperty({ example: 'password' })
  password: string;
}
