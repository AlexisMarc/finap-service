import { afterEach, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { RulesAssistantProvider } from './rules-assistant.provider.js';
import { LlmAssistantProvider } from './llm-assistant.provider.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { AnalyticsService } from '../analytics/analytics.service.js';

function configWith(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('RulesAssistantProvider', () => {
  it('responde con la categoría de mayor gasto', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ currency: 'USD' }) },
      transaction: { findFirst: vi.fn() },
    } as unknown as PrismaService;
    const analytics = {
      getSummary: vi.fn().mockResolvedValue({
        income: 6200,
        expense: 3480,
        debt: 0,
        balance: 24580,
        trend: 0,
        categories: [{ categoryId: 'c_vivienda', name: 'Vivienda', color: '#EB001B', amount: 1392, percentage: 40 }],
      }),
    } as unknown as AnalyticsService;

    const provider = new RulesAssistantProvider(prisma, analytics);
    const answer = await provider.ask({ userId: 'u_1', question: '¿En qué gasté más este mes?' });

    expect(answer).toContain('Vivienda');
    expect(answer).toContain('40%');
    expect(answer).toContain('$');
  });
});

describe('LlmAssistantProvider', () => {
  const fallback = { ask: vi.fn().mockResolvedValue('respuesta determinista') };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('usa el fallback cuando no hay LLM_API_KEY', async () => {
    const provider = new LlmAssistantProvider(configWith({}), fallback);
    const answer = await provider.ask({ userId: 'u_1', question: 'hola' });
    expect(answer).toBe('respuesta determinista');
  });

  it('usa el fallback cuando el proveedor externo falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const provider = new LlmAssistantProvider(
      configWith({ LLM_API_KEY: 'key', LLM_BASE_URL: 'https://example.test', LLM_MODEL: 'test' }),
      fallback,
    );
    const answer = await provider.ask({ userId: 'u_1', question: 'hola' });
    expect(answer).toBe('respuesta determinista');
  });
});
