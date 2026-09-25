import { afterEach, describe, expect, it } from 'vitest';
import { resolveCorsOrigins } from './cors.js';

const originalCors = process.env.CORS_ORIGINS;
const originalEnv = process.env.VERCEL_ENV;

afterEach(() => {
  if (originalCors === undefined) delete process.env.CORS_ORIGINS;
  else process.env.CORS_ORIGINS = originalCors;
  if (originalEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalEnv;
});

describe('resolveCorsOrigins', () => {
  it('usa la lista explícita de CORS_ORIGINS', () => {
    process.env.CORS_ORIGINS = 'https://app.finap.app, https://admin.finap.app';
    expect(resolveCorsOrigins()).toEqual(['https://app.finap.app', 'https://admin.finap.app']);
  });

  it('ignora entradas vacías', () => {
    process.env.CORS_ORIGINS = 'https://app.finap.app,,  ,';
    expect(resolveCorsOrigins()).toEqual(['https://app.finap.app']);
  });

  it('en producción sin lista no autoriza cross-origin', () => {
    delete process.env.CORS_ORIGINS;
    process.env.VERCEL_ENV = 'production';
    expect(resolveCorsOrigins()).toBe(false);
  });

  it('en local/preview sin lista permite', () => {
    delete process.env.CORS_ORIGINS;
    delete process.env.VERCEL_ENV;
    expect(resolveCorsOrigins()).toBe(true);
  });
});
