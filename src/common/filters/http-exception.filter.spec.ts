import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

interface MockResponse {
  statusCode: number;
  body: { error: { code: string; message: string; details?: unknown } };
  status(code: number): MockResponse;
  json(body: MockResponse['body']): MockResponse;
}

function createHost(): { host: ArgumentsHost; res: MockResponse } {
  const res = {} as MockResponse;
  res.statusCode = 0;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: MockResponse['body']) => {
    res.body = body;
    return res;
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { host, res };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('normaliza 401', () => {
    const { host, res } = createHost();
    filter.catch(new UnauthorizedException({ code: 'unauthorized', message: 'Credenciales inválidas' }), host);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: { code: 'unauthorized', message: 'Credenciales inválidas' } });
  });

  it('normaliza 404', () => {
    const { host, res } = createHost();
    filter.catch(new NotFoundException({ code: 'not_found', message: 'No existe' }), host);
    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('normaliza 409', () => {
    const { host, res } = createHost();
    filter.catch(new ConflictException({ code: 'conflict', message: 'Duplicado' }), host);
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('conflict');
  });

  it('normaliza 422 con details', () => {
    const { host, res } = createHost();
    filter.catch(
      new UnprocessableEntityException({
        code: 'validation_error',
        message: 'Datos inválidos',
        details: { amount: 'requerido' },
      }),
      host,
    );
    expect(res.statusCode).toBe(422);
    expect(res.body.error).toEqual({
      code: 'validation_error',
      message: 'Datos inválidos',
      details: { amount: 'requerido' },
    });
  });

  it('usa internal_error para excepciones desconocidas', () => {
    const { host, res } = createHost();
    filter.catch(new Error('boom'), host);
    expect(res.statusCode).toBe(500);
    expect(res.body.error.code).toBe('internal_error');
  });
});
