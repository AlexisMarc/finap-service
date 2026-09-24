import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import type { TransactionType } from '../../common/api-types';

export class QueryTransactionsDto {
  @IsOptional()
  @IsIn(['income', 'expense', 'debt'], { message: 'type inválido' })
  type?: TransactionType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'from inválida' })
  from?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'to inválida' })
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['date', 'amount'], { message: 'sort inválido' })
  sort?: 'date' | 'amount';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'order inválido' })
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pageSize?: number;
}
