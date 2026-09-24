import { IsNotEmpty, IsNumber, IsPositive, IsString, Matches } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty({ message: 'categoryId es requerido' })
  categoryId!: string;

  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month debe tener formato YYYY-MM' })
  month!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'limit debe ser numérico con 2 decimales' })
  @IsPositive({ message: 'limit debe ser positivo' })
  limit!: number;
}
