import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsModule } from '../analytics/analytics.module.js';
import { AssistantController } from './assistant.controller.js';
import { AssistantService } from './assistant.service.js';
import { ASSISTANT_PROVIDER } from './assistant-provider.interface.js';
import { RulesAssistantProvider } from './rules-assistant.provider.js';
import { LlmAssistantProvider } from './llm-assistant.provider.js';

@Module({
  imports: [AnalyticsModule],
  controllers: [AssistantController],
  providers: [
    RulesAssistantProvider,
    AssistantService,
    {
      provide: ASSISTANT_PROVIDER,
      inject: [ConfigService, RulesAssistantProvider],
      useFactory: (config: ConfigService, rules: RulesAssistantProvider) =>
        config.get<string>('LLM_API_KEY')
          ? new LlmAssistantProvider(config, rules)
          : rules,
    },
  ],
})
export class AssistantModule {}
