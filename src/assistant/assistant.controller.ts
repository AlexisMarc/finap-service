import { Body, Controller, Post } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AskAssistantDto } from './dto/ask-assistant.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/api-types';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('ask')
  ask(@CurrentUser() user: AuthUser, @Body() dto: AskAssistantDto): Promise<{ answer: string }> {
    return this.assistantService.ask(user.userId, dto);
  }
}
