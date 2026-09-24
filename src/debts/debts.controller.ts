import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { DebtsService } from './debts.service.js';
import { CreateDebtDto } from './dto/create-debt.dto.js';
import { UpdateDebtDto } from './dto/update-debt.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser, DebtDto } from '../common/api-types.js';

@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<DebtDto[]> {
    return this.debtsService.list(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDebtDto): Promise<DebtDto> {
    return this.debtsService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDebtDto,
  ): Promise<DebtDto> {
    return this.debtsService.update(user.userId, id, dto);
  }

  @Post(':id/payments')
  @HttpCode(200)
  addPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ): Promise<DebtDto> {
    return this.debtsService.addPayment(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.debtsService.remove(user.userId, id);
  }
}
