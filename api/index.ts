import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createApp } from '../src/bootstrap.js';

let appPromise: Promise<INestApplication> | undefined;

async function getApp(): Promise<INestApplication> {
  if (!appPromise) {
    appPromise = createApp().then(async (app) => {
      await app.init();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const app = await getApp();
  const instance = app.getHttpAdapter().getInstance() as (request: Request, response: Response) => void;
  instance(req, res);
}
