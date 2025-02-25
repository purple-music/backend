import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationErrorItem } from './common/dtos/validation-error.response.dto';
import { PathItemObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

const formatNestedErrors = (
  errors: ValidationError[],
): ValidationErrorItem[] => {
  return errors.map((error) => {
    const formattedError: ValidationErrorItem = {
      field: error.property,
      messages: error.constraints
        ? Object.values(error.constraints)
        : undefined,
      children:
        error.children && error.children.length > 0
          ? formatNestedErrors(error.children)
          : undefined,
    };

    return formattedError;
  });
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const formattedErrors = formatNestedErrors(errors);

        // Return a standard error response
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
          timestamp: new Date().toISOString(),
        });
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Purple Music')
    .setDescription('Purple Music API')
    .setVersion('1.0')
    .addTag('purple')
    .addBearerAuth()
    .build();

  const documentFactory = () => {
    const document = SwaggerModule.createDocument(app, config);

    document.components ||= {};
    document.components.schemas ||= {};
    document.components.schemas.ValidationErrorResponse = {
      type: 'object',
      properties: {
        status: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ValidationErrorItem',
          },
        },
        timestamp: { type: 'string', example: '2023-10-10T12:34:56.789Z' },
      },
    };

    document.components.schemas.ValidationErrorItem = {
      type: 'object',
      properties: {
        field: { type: 'string', example: 'address' },
        messages: {
          type: 'array',
          items: { type: 'string', example: 'city is required' },
        },
        children: {
          type: 'array',
          items: { $ref: '#/components/schemas/ValidationErrorItem' },
        },
      },
    };

    const paths = document.paths as Record<string, PathItemObject>;
    Object.keys(paths).forEach((path) => {
      const methods = paths[path];
      Object.keys(methods).forEach((method) => {
        const operation = methods[method as keyof PathItemObject];
        if (operation && typeof operation === 'object') {
          if ('responses' in operation) {
            // OperationObject
            operation.responses['400'] = {
              description: 'Validation failed.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ValidationErrorResponse',
                  },
                },
              },
            };
          }
        }
      });
    });

    return document;
  };

  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
