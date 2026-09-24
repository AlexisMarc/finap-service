import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller.js';
import { MeController } from './me.controller.js';
import { AccountsService } from './accounts.service.js';

@Module({
  controllers: [MeController, AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
