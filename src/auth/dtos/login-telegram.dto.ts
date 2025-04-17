import { ApiProperty } from '@nestjs/swagger';

export class LoginTelegramRequestDto {
  @ApiProperty()
  initData: string;
}

export class LoginTelegramResponseDto {
  @ApiProperty()
  message: string;
}
