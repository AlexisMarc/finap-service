import { Inject, Injectable } from '@nestjs/common';
import { ASSISTANT_PROVIDER } from './assistant-provider.interface';
import type { AssistantProvider } from './assistant-provider.interface';
import type { AskAssistantDto } from './dto/ask-assistant.dto';

@Injectable()
export class AssistantService {
  constructor(
    @Inject(ASSISTANT_PROVIDER) private readonly provider: AssistantProvider,
  ) {}

  async ask(userId: string, dto: AskAssistantDto): Promise<{ answer: string }> {
    const answer = await this.provider.ask({
      userId,
      question: dto.question,
      context: dto.context,
    });
    return { answer };
  }
}
