import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AskAssistantDto {
  @IsString()
  @IsNotEmpty({ message: 'question es requerida' })
  question!: string;

  @IsOptional()
  context?: unknown;
}
