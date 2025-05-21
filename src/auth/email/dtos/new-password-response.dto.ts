import { ApiProperty } from '@nestjs/swagger';

export class NewPasswordResponseDto {
  @ApiProperty({
    example: 'Password reset successful',
  })
  message: string;
}
