export const ASSISTANT_PROVIDER = 'ASSISTANT_PROVIDER';

export interface AssistantInput {
  userId: string;
  question: string;
  context?: unknown;
}

export interface AssistantProvider {
  ask(input: AssistantInput): Promise<string>;
}
