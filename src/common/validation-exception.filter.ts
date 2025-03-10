import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { ValidationException } from './validation-exception';
import { ValidationErrorResponseDto } from './dtos/validation-error.response.dto';
import { Response } from 'express';

@Catch()
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let errorResponse: ValidationErrorResponseDto;

    if (exception instanceof ValidationException) {
      // Already standardized
      errorResponse = exception.getResponse() as ValidationErrorResponseDto;
    } else {
      // Don't handle other types of exceptions
      return;
    }

    response.status(400).json(errorResponse);
  }
}
