import { IsNumber, IsPositive } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount debe ser numérico con 2 decimales' })
  @IsPositive({ message: 'amount debe ser positivo' })
  amount!: number;
}
