import { UnprocessableEntityException } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import {
  createValidationPipe,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  resolvePagination,
} from './validation.pipe.js';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto.js';

describe('resolvePagination', () => {
  it('aplica valores por defecto', () => {
    expect(resolvePagination()).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      skip: 0,
      take: DEFAULT_PAGE_SIZE,
    });
  });

  it('limita pageSize al máximo', () => {
    expect(resolvePagination(2, 999).take).toBe(MAX_PAGE_SIZE);
  });

  it('corrige valores inválidos', () => {
    expect(resolvePagination(-1, 0)).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      skip: 0,
      take: DEFAULT_PAGE_SIZE,
    });
  });

  it('calcula skip según la página', () => {
    expect(resolvePagination(3, 10).skip).toBe(20);
  });
});

describe('createValidationPipe', () => {
  it('mapea fallos a 422 validation_error con detalles', async () => {
    const pipe = createValidationPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateTransactionDto,
      data: undefined,
    };

    await expect(
      pipe.transform(
        { type: 'expense', amount: -1, categoryId: '', date: 'no-es-fecha' },
        metadata,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    try {
      await pipe.transform(
        { type: 'expense', amount: -1, categoryId: '', date: 'no-es-fecha' },
        metadata,
      );
    } catch (error) {
      const response = (error as UnprocessableEntityException).getResponse() as {
        code: string;
        details: Record<string, string>;
      };
      expect(response.code).toBe('validation_error');
      expect(response.details).toHaveProperty('amount');
      expect(response.details).toHaveProperty('date');
    }
  });
});
