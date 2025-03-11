import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class NewPasswordRequestDto {
  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  token: string;
}
