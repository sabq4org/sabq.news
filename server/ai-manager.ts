import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import pLimit from 'p-limit';
import pRetry from 'p-retry';

// AI Provider Types
export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  provider: AIProvider;
  model: string;
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  error?: string;
}

// Initialize AI Clients
class AIManager {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenAI;
  private limiter = pLimit(3); // Max 3 concurrent requests

  constructor() {
    // OpenAI - Use Replit AI Integrations or fallback to user's key
    this.openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });

    // Anthropic - Use Replit AI Integrations
    this.anthropic = new Anthropic({
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    });

    // Gemini - Use Replit AI Integrations
    this.gemini = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
    });
  }

  // Generate text with a single model
  async generate(
    prompt: string,
    config: AIModelConfig
  ): Promise<AIResponse> {
    return pRetry(
      async () => {
        try {
          switch (config.provider) {
            case 'openai':
              return await this.generateOpenAI(prompt, config);
            case 'anthropic':
              return await this.generateAnthropic(prompt, config);
            case 'gemini':
              return await this.generateGemini(prompt, config);
            default:
              throw new Error(`Unknown provider: ${config.provider}`);
          }
        } catch (error: any) {
          throw new Error(`${config.provider}/${config.model}: ${error.message}`);
        }
      },
      {
        retries: 2,
        minTimeout: 1000,
      }
    );
  }

  // Generate with multiple models in parallel
  async generateMultiple(
    prompt: string,
    configs: AIModelConfig[]
  ): Promise<AIResponse[]> {
    const tasks = configs.map((config) =>
      this.limiter(() => this.generate(prompt, config))
    );

    // Wait for all, but don't fail if one fails
    const results = await Promise.allSettled(tasks);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          provider: configs[index].provider,
          model: configs[index].model,
          content: '',
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  // OpenAI Implementation
  private async generateOpenAI(
    prompt: string,
    config: AIModelConfig
  ): Promise<AIResponse> {
    const response = await this.openai.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: config.maxTokens || 500,
      temperature: config.temperature || 0.7,
    });

    return {
      provider: 'openai',
      model: config.model,
      content: response.choices[0]?.message?.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }

  // Anthropic Implementation
  private async generateAnthropic(
    prompt: string,
    config: AIModelConfig
  ): Promise<AIResponse> {
    const response = await this.anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens || 500,
      temperature: config.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return {
      provider: 'anthropic',
      model: config.model,
      content: text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  // Gemini Implementation
  private async generateGemini(
    prompt: string,
    config: AIModelConfig
  ): Promise<AIResponse> {
    const response = await this.gemini.models.generateContent({
      model: config.model,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      config: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 500,
      },
    });

    return {
      provider: 'gemini',
      model: config.model,
      content: response.text || '',
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }
}

// Export singleton instance
export const aiManager = new AIManager();

// Predefined model configurations
export const AI_MODELS = {
  // OpenAI
  GPT5: { provider: 'openai' as const, model: 'gpt-4o' },
  O3_MINI: { provider: 'openai' as const, model: 'o3-mini' },
  GPT4: { provider: 'openai' as const, model: 'gpt-4o' },
  
  // Anthropic
  CLAUDE_OPUS: { provider: 'anthropic' as const, model: 'claude-opus-4-1' },
  CLAUDE_SONNET: { provider: 'anthropic' as const, model: 'claude-sonnet-4-5' },
  CLAUDE_HAIKU: { provider: 'anthropic' as const, model: 'claude-haiku-4-5' },
  
  // Gemini
  GEMINI_PRO: { provider: 'gemini' as const, model: 'gemini-2.5-pro' },
  GEMINI_FLASH: { provider: 'gemini' as const, model: 'gemini-2.5-flash' },
};
