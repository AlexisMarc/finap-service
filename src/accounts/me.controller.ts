import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AccountsService } from './accounts.service.js';
import { UpdateMeDto } from './dto/update-me.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser, UserDto } from '../common/api-types.js';

@Controller('me')
export class MeController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  getMe(@CurrentUser() user: AuthUser): Promise<UserDto> {
    return this.accountsService.getMe(user.userId);
  }

  @Patch()
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto): Promise<UserDto> {
    return this.accountsService.updateMe(user.userId, dto);
  }
}
