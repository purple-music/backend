import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({
    example: 'Password reset email sent successfully',
  })
  message: string;
}
