import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse } from '@nestjs/swagger';
import { ValidationErrorResponseDto } from './dtos/validation-error.response.dto';

export function ApiValidationResponse() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Validation Failed',
      type: ValidationErrorResponseDto,
      example: {
        message: 'Validation Failed',
        errors: [
          {
            field: 'token',
            messages: ['Token is required'],
          },
        ],
      },
    }),
  );
}
