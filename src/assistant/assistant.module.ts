import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { ASSISTANT_PROVIDER } from './assistant-provider.interface';
import { RulesAssistantProvider } from './rules-assistant.provider';
import { LlmAssistantProvider } from './llm-assistant.provider';

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
