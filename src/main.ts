import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ErrorFormatter } from './common/error-formatter';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as cookieParser from 'cookie-parser';

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
        const formattedErrors = ErrorFormatter.format(errors);

        return new BadRequestException(formattedErrors);
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

  // Write the OpenAPI specification to a file
  const outputPath = join(__dirname, '..', 'swagger.json');
  writeFileSync(outputPath, JSON.stringify(documentFactory(), null, 2));

  SwaggerModule.setup('api', app, documentFactory);

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
