import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

const CODE_BY_STATUS: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation_error',
  500: 'internal_error',
};

interface NormalizedError {
  code: string;
  message: string;
  details?: unknown;
}

interface ExceptionBody {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

function normalize(exception: unknown): { status: number; error: NormalizedError } {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const fallbackCode = CODE_BY_STATUS[status] ?? 'error';
    const body = exception.getResponse();

    if (typeof body === 'string') {
      return { status, error: { code: fallbackCode, message: body } };
    }

    const record = body as ExceptionBody;
    const rawMessage = record.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : exception.message;

    const error: NormalizedError = {
      code: typeof record.code === 'string' ? record.code : fallbackCode,
      message,
    };
    if (record.details !== undefined) {
      error.details = record.details;
    }
    return { status, error };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    error: { code: 'internal_error', message: 'Error interno' },
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, error } = normalize(exception);
    response.status(status).json({ error });
  }
}
