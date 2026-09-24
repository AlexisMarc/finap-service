import { IsIn, IsISO8601, IsOptional, Matches } from 'class-validator';
import type { TransactionType } from '../../common/api-types';

export class QueryRangeDto {
  @IsISO8601({}, { message: 'from inválida' })
  from!: string;

  @IsISO8601({}, { message: 'to inválida' })
  to!: string;
}

export class QueryByCategoryDto extends QueryRangeDto {
  @IsOptional()
  @IsIn(['income', 'expense', 'debt'], { message: 'type inválido' })
  type?: TransactionType;
}

export class QueryEvolutionDto extends QueryRangeDto {
  @IsIn(['day', 'week', 'month'], { message: 'interval inválido' })
  interval!: 'day' | 'week' | 'month';
}

export class QueryDashboardDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month debe tener formato YYYY-MM' })
  month!: string;
}
