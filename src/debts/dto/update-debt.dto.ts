import { PartialType } from '@nestjs/mapped-types';
import { CreateDebtDto } from './create-debt.dto.js';

export class UpdateDebtDto extends PartialType(CreateDebtDto) {}
