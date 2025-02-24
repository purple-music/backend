import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

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
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          const message = constraints
            ? Object.values(constraints).join(', ')
            : 'Validation failed';
          return {
            field: error.property,
            message,
          };
        });

        return new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          // Custom field for detailed errors from class-validator
          details: messages,
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
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
