import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { BudgetsService } from './budgets.service.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { UpdateBudgetDto } from './dto/update-budget.dto.js';
import { QueryBudgetsDto } from './dto/query-budgets.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser, BudgetDto } from '../common/api-types.js';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: QueryBudgetsDto): Promise<BudgetDto[]> {
    return this.budgetsService.list(user.userId, query.month);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBudgetDto): Promise<BudgetDto> {
    return this.budgetsService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<BudgetDto> {
    return this.budgetsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.budgetsService.remove(user.userId, id);
  }
}
