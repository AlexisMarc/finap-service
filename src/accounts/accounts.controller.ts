import { Controller, Get } from '@nestjs/common';
import { AccountsService } from './accounts.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AccountDto, AuthUser } from '../common/api-types.js';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<AccountDto[]> {
    return this.accountsService.listAccounts(user.userId);
  }
}
