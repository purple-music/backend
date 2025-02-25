import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse } from '@nestjs/swagger';
import { ValidationErrorResponse } from './dtos/validation-error.response.dto';

export function ApiValidationResponse() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Validation Failed',
      type: ValidationErrorResponse,
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
