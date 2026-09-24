import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'name es requerido' })
  name!: string;

  @IsString()
  @Matches(/^#(?:[0-9a-fA-F]{6})$/, { message: 'color debe ser un hex válido (#RRGGBB)' })
  color!: string;

  @IsString()
  @IsNotEmpty({ message: 'icon es requerido' })
  icon!: string;
}
