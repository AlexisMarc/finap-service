import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { QueryTransactionsDto } from './dto/query-transactions.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser, PaginatedDto, TransactionDto } from '../common/api-types.js';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryTransactionsDto,
  ): Promise<PaginatedDto<TransactionDto>> {
    return this.transactionsService.list(user.userId, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto): Promise<TransactionDto> {
    return this.transactionsService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.transactionsService.remove(user.userId, id);
  }
}
