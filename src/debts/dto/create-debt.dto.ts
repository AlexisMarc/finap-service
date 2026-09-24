import { IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateDebtDto {
  @IsString()
  @IsNotEmpty({ message: 'name es requerido' })
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'total debe ser numérico con 2 decimales' })
  @IsPositive({ message: 'total debe ser positivo' })
  total!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'paid debe ser numérico con 2 decimales' })
  @Min(0, { message: 'paid no puede ser negativo' })
  paid?: number;

  @IsOptional()
  @IsISO8601({}, { message: 'dueDate inválida' })
  dueDate?: string;
}
