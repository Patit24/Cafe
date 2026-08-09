import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';
const nodeUtil = require('util');
if (nodeUtil) {
  if (!nodeUtil.TextEncoder) nodeUtil.TextEncoder = NodeTextEncoder || globalThis.TextEncoder;
  if (!nodeUtil.TextDecoder) nodeUtil.TextDecoder = NodeTextDecoder || globalThis.TextDecoder;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { initServerFaceEngine } from './utils/serverFaceEngine';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  // Pre-warm neural face recognition models in background so face verification is instant
  initServerFaceEngine().catch((err) =>
    console.error('Background face engine pre-warming warning:', err),
  );
}
void bootstrap();
