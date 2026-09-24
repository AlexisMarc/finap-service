import { IsIn, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import type { TransactionType } from '../../common/api-types';

export class CreateTransactionDto {
  @IsIn(['income', 'expense', 'debt'], { message: 'type inválido' })
  type!: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount debe ser numérico con 2 decimales' })
  @IsPositive({ message: 'amount debe ser positivo' })
  amount!: number;

  @IsString()
  @IsNotEmpty({ message: 'categoryId es requerido' })
  categoryId!: string;

  @IsISO8601({}, { message: 'date inválida' })
  date!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
