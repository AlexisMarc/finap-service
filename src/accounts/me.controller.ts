import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser, UserDto } from '../common/api-types';

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
