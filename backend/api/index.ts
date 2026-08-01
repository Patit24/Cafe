import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { json, urlencoded, Request, Response, NextFunction } from 'express';

const server = express();
server.use(json({ limit: '50mb' }));
server.use(urlencoded({ extended: true, limit: '50mb' }));

// Handle CORS preflight at express level (before NestJS routing)
server.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Immediately respond to preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

let isInitialized = false;
let nestApp: any = null;

async function bootstrap() {
  if (isInitialized) return;
  nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server));
  nestApp.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: false,
  });
  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await nestApp.init();
  isInitialized = true;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  server(req, res);
}
