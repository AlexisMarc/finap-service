import { UnprocessableEntityException, ValidationError, ValidationPipe } from '@nestjs/common';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

function flatten(errors: ValidationError[], parent = ''): Record<string, string> {
  const details: Record<string, string> = {};
  for (const error of errors) {
    const property = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      details[property] = Object.values(error.constraints).join(', ');
    }
    if (error.children && error.children.length > 0) {
      Object.assign(details, flatten(error.children, property));
    }
  }
  return details;
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
    exceptionFactory: (errors: ValidationError[]) => {
      const details = flatten(errors);
      return new UnprocessableEntityException({
        code: 'validation_error',
        message: 'Datos inválidos',
        details,
      });
    },
  });
}

export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function resolvePagination(page?: number, pageSize?: number): Pagination {
  const safePage = Number.isFinite(page) && (page as number) > 0 ? Math.floor(page as number) : 1;
  const requested = Number.isFinite(pageSize) && (pageSize as number) > 0
    ? Math.floor(pageSize as number)
    : DEFAULT_PAGE_SIZE;
  const safePageSize = Math.min(requested, MAX_PAGE_SIZE);
  return {
    page: safePage,
    pageSize: safePageSize,
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  };
}
