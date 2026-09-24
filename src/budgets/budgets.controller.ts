import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetsDto } from './dto/query-budgets.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser, BudgetDto } from '../common/api-types';

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
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.budgetsService.remove(user.userId, id);
  }
}
