import { IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import type { Currency } from '../../common/api-types';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'name no puede estar vacío' })
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'avatarUrl debe ser una URL válida' })
  avatarUrl?: string;

  @IsOptional()
  @IsIn(['USD', 'COP', 'EUR'], { message: 'currency inválida' })
  currency?: Currency;
}
