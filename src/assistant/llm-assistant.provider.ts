import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AssistantInput, AssistantProvider } from './assistant-provider.interface';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

@Injectable()
export class LlmAssistantProvider implements AssistantProvider {
  private readonly logger = new Logger(LlmAssistantProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly fallback: AssistantProvider,
  ) {}

  async ask(input: AssistantInput): Promise<string> {
    const apiKey = this.config.get<string>('LLM_API_KEY');
    const baseUrl = this.config.get<string>('LLM_BASE_URL') ?? 'https://api.openai.com/v1';
    const model = this.config.get<string>('LLM_MODEL') ?? 'gpt-4o-mini';

    if (!apiKey) {
      return this.fallback.ask(input);
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'Eres el asistente financiero de Finap. Responde en una sola frase breve, en español.',
            },
            { role: 'user', content: input.question },
          ],
          max_tokens: 120,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM respondió ${response.status}`);
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const answer = data.choices?.[0]?.message?.content?.trim();
      return answer && answer.length > 0 ? answer : this.fallback.ask(input);
    } catch (error) {
      this.logger.error(`Fallo del proveedor LLM: ${(error as Error).message}`);
      return this.fallback.ask(input);
    }
  }
}
