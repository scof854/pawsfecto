import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';
import type { Express } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

export async function createApp(server?: Express) {
  const app = server
    ? await NestFactory.create<NestExpressApplication>(
        AppModule,
        new ExpressAdapter(server),
        { bufferLogs: true },
      )
    : await NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
      });

  app.use(helmet());
  app.enableCors({
    origin: parseOrigins(process.env.CORS_ORIGIN),
    methods: ['GET', 'POST'],
    credentials: false,
  });

  app.set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api');

  return app;
}

function parseOrigins(raw?: string): string | string[] | boolean {
  if (!raw || raw.trim() === '*') return true;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
