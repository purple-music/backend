import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ValidationErrorItemDto,
  ValidationErrorResponseDto,
} from './dtos/validation-error.response.dto';
import { ErrorFormatter } from './error-formatter';

export class ValidationException extends HttpException {
  constructor(response: ValidationErrorResponseDto) {
    super(response, HttpStatus.BAD_REQUEST);
  }

  public static format(
    field: ValidationErrorItemDto['field'],
    message: string,
  ) {
    const error = {
      field,
      messages: [message],
    };
    return new ValidationException(ErrorFormatter.format([error]));
  }
}
