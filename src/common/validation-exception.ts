import { HttpException, HttpStatus } from '@nestjs/common';
import { ValidationErrorResponse } from './dtos/validation-error.response.dto';

export class ValidationException extends HttpException {
  constructor(response: ValidationErrorResponse) {
    super(response, HttpStatus.BAD_REQUEST);
  }
}
