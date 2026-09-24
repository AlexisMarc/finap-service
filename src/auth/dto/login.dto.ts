import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email inválido' })
  @IsNotEmpty({ message: 'email es requerido' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'password es requerido' })
  password!: string;
}
