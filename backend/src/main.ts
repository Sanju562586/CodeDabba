import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as dns from 'dns';

console.log('Main.ts environment check:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  ENV_LOADED: !!process.env.DATABASE_URL,
});

async function bootstrap() {
  dns.setServers(['8.8.8.8', '1.1.1.1']); // Force Node.js to use Google/Cloudflare DNS

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://code-dabba.vercel.app'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
