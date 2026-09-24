import { Controller, Get } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AccountDto, AuthUser } from '../common/api-types';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<AccountDto[]> {
    return this.accountsService.listAccounts(user.userId);
  }
}
