import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorItem {
  @ApiProperty({
    description: 'The field that failed validation',
    example: 'email',
  })
  field: string;

  @ApiProperty({
    description: 'Validation error messages',
    type: [String],
    example: ['email must be a valid email address'],
    required: false,
  })
  messages?: string[];

  @ApiProperty({
    description: 'Nested validation errors',
    type: () => [ValidationErrorItem],
    required: false,
  })
  children?: ValidationErrorItem[];
}

export class ValidationErrorResponse {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation Failed',
  })
  message: string;

  @ApiProperty({
    description: 'List of validation errors',
    type: [ValidationErrorItem],
  })
  errors: ValidationErrorItem[];

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2023-10-10T12:34:56.789Z',
  })
  timestamp: string;
}
