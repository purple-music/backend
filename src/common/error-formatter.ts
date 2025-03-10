import { ValidationError } from 'class-validator';
import {
  ValidationErrorItemDto,
  ValidationErrorResponseDto,
} from './dtos/validation-error.response.dto';

export class ErrorFormatter {
  static format(
    errors: ValidationError[] | ValidationErrorItemDto[],
    message: string = 'Validation Failed',
  ): ValidationErrorResponseDto {
    const formattedErrors =
      Array.isArray(errors) && errors[0] instanceof ValidationError
        ? this.formatClassValidatorErrors(errors as ValidationError[])
        : (errors as ValidationErrorItemDto[]);

    return {
      statusCode: 400,
      message,
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
    };
  }

  private static formatClassValidatorErrors(
    errors: ValidationError[],
  ): ValidationErrorItemDto[] {
    return errors.map((error) => ({
      field: error.property,
      messages: error.constraints ? Object.values(error.constraints) : [],
      children: error.children?.length
        ? this.formatClassValidatorErrors(error.children)
        : undefined,
    }));
  }
}
