import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { createApp } from './bootstrap.js';

async function bootstrap(): Promise<void> {
  const app = await createApp();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Finap API escuchando en http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
