import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AssistantService } from './assistant.service.js';
import { AskAssistantDto } from './dto/ask-assistant.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/api-types.js';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('ask')
  @HttpCode(200)
  ask(@CurrentUser() user: AuthUser, @Body() dto: AskAssistantDto): Promise<{ answer: string }> {
    return this.assistantService.ask(user.userId, dto);
  }
}
