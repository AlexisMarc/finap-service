import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { MeController } from './me.controller';
import { AccountsService } from './accounts.service';

@Module({
  controllers: [MeController, AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
