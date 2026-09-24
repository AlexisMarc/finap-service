import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { createValidationPipe } from './common/validation.pipe.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Finap API escuchando en http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
