import { applyDecorators } from '@nestjs/common';
import { ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UnauthorizedResponseDto } from './dtos/unauthorized-response.dto';

export function ApiJwtUnauthorizedResponse() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'JWT Validation Failed',
      type: UnauthorizedResponseDto,
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'UnauthorizedException',
      },
    }),
  );
}
