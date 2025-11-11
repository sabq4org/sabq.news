import { aiManager, AI_MODELS } from './ai-manager';
import type { AIModelConfig } from './ai-manager';

export type ChatLanguage = 'ar' | 'en' | 'ur';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  recentArticles?: {
    title: string;
    summary?: string;
    categoryName?: string;
  }[];
  conversationHistory?: ChatMessage[];
}

const LANGUAGE_MODEL_MAPPING: Record<ChatLanguage, AIModelConfig> = {
  ar: {
    ...AI_MODELS.CLAUDE_SONNET,
    maxTokens: 1000,
    temperature: 0.7,
  },
  en: {
    ...AI_MODELS.GPT4,
    maxTokens: 1000,
    temperature: 0.7,
  },
  ur: {
    ...AI_MODELS.GEMINI_PRO,
    maxTokens: 1000,
    temperature: 0.7,
  },
};

const SYSTEM_PROMPTS: Record<ChatLanguage, (articlesContext: string) => string> = {
  ar: (articlesContext: string) => `أنت مساعد أخبار ذكي لصحيفة سبق. ساعد القراء في العثور على الأخبار والمعلومات. أجب بالعربية دائماً بشكل واضح ومفيد.

${articlesContext ? `آخر الأخبار المنشورة:\n${articlesContext}\n\nاستخدم هذه الأخبار للإجابة على أسئلة القارئ عندما يكون ذلك مناسباً.` : ''}

قدم إجابات دقيقة ومختصرة ومفيدة.`,

  en: (articlesContext: string) => `You are an intelligent news assistant for Sabq newspaper. Help readers find news and information. Always respond in English clearly and helpfully.

${articlesContext ? `Recent published news:\n${articlesContext}\n\nUse these articles to answer the reader's questions when appropriate.` : ''}

Provide accurate, concise, and helpful answers.`,

  ur: (articlesContext: string) => `آپ سبق اخبار کے لیے ایک ذہین خبر معاون ہیں۔ قارئین کو خبریں اور معلومات تلاش کرنے میں مدد کریں۔ ہمیشہ اردو میں واضح اور مددگار انداز میں جواب دیں۔

${articlesContext ? `حالیہ شائع شدہ خبریں:\n${articlesContext}\n\nمناسب ہونے پر قارئین کے سوالات کے جواب دینے کے لیے ان مضامین کا استعمال کریں۔` : ''}

درست، جامع اور مددگار جوابات فراہم کریں۔`,
};

const ERROR_MESSAGES: Record<ChatLanguage, { auth: string; rate: string; general: string }> = {
  ar: {
    auth: 'عذراً، هناك مشكلة في إعدادات المساعد الذكي. يرجى المحاولة لاحقاً.',
    rate: 'عذراً، لقد تجاوزت حد الاستخدام. يرجى المحاولة بعد قليل.',
    general: 'عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى.',
  },
  en: {
    auth: 'Sorry, there is an issue with the assistant settings. Please try again later.',
    rate: 'Sorry, you have exceeded the usage limit. Please try again shortly.',
    general: 'Sorry, I could not process your request. Please try again.',
  },
  ur: {
    auth: 'معذرت، معاون کی ترتیبات میں کوئی مسئلہ ہے۔ براہ کرم بعد میں کوشش کریں۔',
    rate: 'معذرت، آپ نے استعمال کی حد سے تجاوز کر دیا ہے۔ براہ کرم تھوڑی دیر بعد کوشش کریں۔',
    general: 'معذرت، میں آپ کی درخواست پر کارروائی نہیں کر سکا۔ براہ کرم دوبارہ کوشش کریں۔',
  },
};

export async function chatWithMultilingualAssistant(
  message: string,
  language: ChatLanguage,
  context?: ChatContext
): Promise<string> {
  try {
    console.log(`[MultilingualChatbot] Processing ${language} message:`, message.substring(0, 100));

    const articlesContext = context?.recentArticles
      ? context.recentArticles
          .map((article, index) => {
            const parts = [`${index + 1}. ${article.title}`];
            if (article.categoryName) parts.push(`(${article.categoryName})`);
            if (article.summary) parts.push(`\n   Summary: ${article.summary}`);
            return parts.join(' ');
          })
          .join('\n')
      : '';

    const systemPrompt = SYSTEM_PROMPTS[language](articlesContext);
    const modelConfig = LANGUAGE_MODEL_MAPPING[language];

    console.log(`[MultilingualChatbot] Using model: ${modelConfig.provider}/${modelConfig.model} for language: ${language}`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (context?.conversationHistory) {
      messages.push(...context.conversationHistory);
    }

    messages.push({ role: 'user', content: message });

    const fullPrompt = messages.map(msg => {
      if (msg.role === 'system') return msg.content;
      return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
    }).join('\n\n');

    const response = await aiManager.generate(fullPrompt, modelConfig);

    if (!response.content) {
      console.warn('[MultilingualChatbot] Empty response from AI');
      return ERROR_MESSAGES[language].general;
    }

    console.log(`[MultilingualChatbot] Response generated successfully (${response.usage?.outputTokens || 0} tokens)`);
    return response.content;

  } catch (error: any) {
    console.error('[MultilingualChatbot] Error:', error);
    console.error('[MultilingualChatbot] Error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
    });

    if (error.status === 401 || error.message?.includes('authentication')) {
      return ERROR_MESSAGES[language].auth;
    }

    if (error.status === 429 || error.message?.includes('rate limit')) {
      return ERROR_MESSAGES[language].rate;
    }

    return ERROR_MESSAGES[language].general;
  }
}

export async function chatWithAssistantFallback(
  message: string,
  language: ChatLanguage,
  context?: ChatContext,
  primaryModel?: AIModelConfig,
  fallbackModel?: AIModelConfig
): Promise<{ content: string; modelUsed: string }> {
  const primary = primaryModel || LANGUAGE_MODEL_MAPPING[language];
  const fallback = fallbackModel || {
    ...AI_MODELS.GPT4,
    maxTokens: 1000,
    temperature: 0.7,
  };

  try {
    const content = await chatWithMultilingualAssistant(message, language, context);
    return {
      content,
      modelUsed: `${primary.provider}/${primary.model}`,
    };
  } catch (error) {
    console.warn(`[MultilingualChatbot] Primary model failed, trying fallback...`);
    
    try {
      const articlesContext = context?.recentArticles
        ? context.recentArticles
            .map((article, index) => `${index + 1}. ${article.title}`)
            .join('\n')
        : '';

      const systemPrompt = SYSTEM_PROMPTS[language](articlesContext);
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      if (context?.conversationHistory) {
        messages.push(...context.conversationHistory);
      }

      messages.push({ role: 'user', content: message });

      const fullPrompt = messages.map(msg => {
        if (msg.role === 'system') return msg.content;
        return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
      }).join('\n\n');

      const response = await aiManager.generate(fullPrompt, fallback);
      
      return {
        content: response.content || ERROR_MESSAGES[language].general,
        modelUsed: `${fallback.provider}/${fallback.model} (fallback)`,
      };
    } catch (fallbackError) {
      console.error('[MultilingualChatbot] Fallback model also failed:', fallbackError);
      return {
        content: ERROR_MESSAGES[language].general,
        modelUsed: 'none (all models failed)',
      };
    }
  }
}

export function getOptimalModelForLanguage(language: ChatLanguage): AIModelConfig {
  return LANGUAGE_MODEL_MAPPING[language];
}

export function getSupportedLanguages(): ChatLanguage[] {
  return ['ar', 'en', 'ur'];
}
