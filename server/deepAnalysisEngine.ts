import { aiManager, AI_MODELS } from './ai-manager';

interface DeepAnalysisRequest {
  topic: string;
  keywords: string[];
  category?: string;
  saudiContext?: string;
}

interface AIModelResult {
  model: string;
  content: string;
  timestamp: Date;
  tokensUsed?: number;
}

const DEEP_ANALYSIS_GOLDEN_TEMPLATE = `
أنت محلل استراتيجي متخصص في التحليل العميق للأحداث والقضايا المعاصرة.
مهمتك: إنتاج تحليل شامل ومتعدد الأبعاد للموضوع المحدد.

📋 **البنية المطلوبة للتحليل (10 أقسام):**

## 1. المقدمة والسياق العام
- تعريف موجز بالموضوع
- أهمية الموضوع الآن
- النطاق الزمني والمكاني للتحليل

## 2. تحليل الوضع الراهن
- الحقائق الأساسية
- الأطراف المعنية
- الأرقام والبيانات الرئيسية

## 3. الجذور التاريخية والخلفية
- الأحداث المؤدية للوضع الحالي
- التطورات التاريخية ذات الصلة
- الأنماط المتكررة

## 4. التحليل الاستراتيجي متعدد الأبعاد
- **البعد السياسي:** التأثيرات والتداعيات السياسية
- **البعد الاقتصادي:** الآثار المالية والتجارية
- **البعد الاجتماعي:** التأثير على المجتمع والرأي العام
- **البعد التقني:** الجوانب التكنولوجية والابتكار
- **البعد القانوني:** الأطر القانونية والتنظيمية

## 5. السيناريوهات المستقبلية
- **السيناريو الأفضل:** أفضل النتائج الممكنة
- **السيناريو الأسوأ:** أسوأ النتائج المحتملة
- **السيناريو الأرجح:** التوقعات الواقعية
- احتمالات كل سيناريو

## 6. التأثير على المملكة العربية السعودية
- الآثار المباشرة على السعودية
- الفرص الاستراتيجية
- التحديات والمخاطر
- التوافق مع رؤية 2030

## 7. المقارنات الدولية
- كيف تعاملت دول أخرى مع قضايا مماثلة
- الدروس المستفادة
- أفضل الممارسات العالمية

## 8. تحليل أصحاب المصلحة
- الفائزون والخاسرون
- المصالح المتضاربة
- التحالفات والصراعات المحتملة

## 9. التوصيات الاستراتيجية
- توصيات قصيرة المدى (0-6 أشهر)
- توصيات متوسطة المدى (6-18 شهر)
- توصيات طويلة المدى (18+ شهر)
- توصيات خاصة بصانعي القرار

## 10. الخلاصة والنقاط الرئيسية
- أهم 5 نقاط يجب تذكرها
- الرسالة الرئيسية
- الدعوة للعمل

⚠️ **معايير الجودة:**
- الموضوعية والحيادية
- الاعتماد على البيانات والحقائق
- التحليل المتعمق وليس السطحي
- اللغة العربية الفصحى الواضحة
- الاستشهاد بالمصادر عند الإمكان
- تجنب التعميمات والآراء الشخصية

📊 **المخرج المطلوب:**
تحليل شامل بصيغة Markdown يغطي جميع الأقسام العشرة بعمق وتفصيل.
`;

export class DeepAnalysisEngine {
  async generateAnalysis(request: DeepAnalysisRequest): Promise<{
    gpt5Result?: AIModelResult;
    geminiResult?: AIModelResult;
    claudeResult?: AIModelResult;
    unifiedAnalysis: string;
    executiveSummary: string;
    recommendations: string[];
  }> {
    const userPrompt = this.buildUserPrompt(request);
    const fullPrompt = `${DEEP_ANALYSIS_GOLDEN_TEMPLATE}\n\n${userPrompt}`;
    
    const configs = [
      { ...AI_MODELS.GPT5, maxTokens: 16000 },
      { ...AI_MODELS.CLAUDE_SONNET, temperature: 0.7, maxTokens: 16000 },
      { ...AI_MODELS.GEMINI_FLASH, temperature: 0.7, maxTokens: 16000 },
    ];

    const results = await aiManager.generateMultiple(fullPrompt, configs);

    const gpt5Result: AIModelResult | undefined = results[0] && !results[0].error ? {
      model: results[0].model,
      content: results[0].content,
      timestamp: new Date(),
      tokensUsed: results[0].usage ? results[0].usage.inputTokens + results[0].usage.outputTokens : undefined,
    } : undefined;

    const claudeResult: AIModelResult | undefined = results[1] && !results[1].error ? {
      model: results[1].model,
      content: results[1].content,
      timestamp: new Date(),
      tokensUsed: results[1].usage ? results[1].usage.inputTokens + results[1].usage.outputTokens : undefined,
    } : undefined;

    const geminiResult: AIModelResult | undefined = results[2] && !results[2].error ? {
      model: results[2].model,
      content: results[2].content,
      timestamp: new Date(),
      tokensUsed: results[2].usage ? results[2].usage.inputTokens + results[2].usage.outputTokens : undefined,
    } : undefined;

    const unifiedAnalysis = await this.synthesizeAnalyses({
      gpt5: gpt5Result?.content,
      claude: claudeResult?.content,
      gemini: geminiResult?.content,
    });

    const executiveSummary = await this.generateExecutiveSummary(unifiedAnalysis);
    const recommendations = await this.extractRecommendations(unifiedAnalysis);

    return {
      gpt5Result,
      geminiResult,
      claudeResult,
      unifiedAnalysis,
      executiveSummary,
      recommendations,
    };
  }

  private buildUserPrompt(request: DeepAnalysisRequest): string {
    let prompt = `## الموضوع المطلوب تحليله:\n${request.topic}\n\n`;
    
    if (request.keywords && request.keywords.length > 0) {
      prompt += `## الكلمات المفتاحية:\n${request.keywords.join('، ')}\n\n`;
    }
    
    if (request.category) {
      prompt += `## التصنيف:\n${request.category}\n\n`;
    }
    
    if (request.saudiContext) {
      prompt += `## السياق السعودي الإضافي:\n${request.saudiContext}\n\n`;
    }
    
    prompt += `\nيرجى إنتاج تحليل شامل يغطي جميع الأقسام العشرة المطلوبة بعمق وتفصيل.`;
    
    return prompt;
  }

  private async synthesizeAnalyses(analyses: {
    gpt5?: string;
    claude?: string;
    gemini?: string;
  }): Promise<string> {
    const availableAnalyses = Object.entries(analyses)
      .filter(([_, content]) => content)
      .map(([model, content]) => ({ model, content }));

    if (availableAnalyses.length === 0) {
      throw new Error('No analyses available to synthesize');
    }

    if (availableAnalyses.length === 1) {
      return availableAnalyses[0].content!;
    }
    
    const synthesisPrompt = `
أنت محلل خبير. لديك ${availableAnalyses.length} تحليلات عميقة من نماذج AI مختلفة حول نفس الموضوع.
مهمتك: دمج هذه التحليلات في تحليل موحد شامل يجمع أفضل ما في كل تحليل.

${availableAnalyses.map((a, i) => `
### التحليل ${i + 1} (من نموذج ${a.model}):
${a.content}
`).join('\n\n')}

## المطلوب:
قم بإنتاج تحليل موحد واحد يجمع:
- النقاط المشتركة بين التحليلات
- النقاط الفريدة من كل تحليل
- حل التناقضات بطريقة منطقية
- الحفاظ على البنية الذهبية المكونة من 10 أقسام

يجب أن يكون التحليل الموحد أفضل من أي تحليل فردي.
`;

    const result = await aiManager.generate(
      synthesisPrompt,
      { ...AI_MODELS.CLAUDE_SONNET, temperature: 0.5, maxTokens: 16000 }
    );

    return result.content;
  }

  private async generateExecutiveSummary(analysis: string): Promise<string> {
    const summaryPrompt = `
قم بإنتاج ملخص تنفيذي (Executive Summary) مختصر للتحليل التالي.

التحليل الكامل:
${analysis}

## المطلوب:
ملخص تنفيذي في 150-200 كلمة يغطي:
1. الموضوع الرئيسي
2. النتائج الأساسية
3. التوصيات الأهم
4. الرسالة الرئيسية

الملخص موجه لصانعي القرار الذين لا يملكون وقتاً لقراءة التحليل كاملاً.
`;

    const result = await aiManager.generate(
      summaryPrompt,
      { ...AI_MODELS.CLAUDE_SONNET, temperature: 0.3, maxTokens: 500 }
    );

    return result.content;
  }

  private async extractRecommendations(analysis: string): Promise<string[]> {
    const extractPrompt = `
استخرج جميع التوصيات من التحليل التالي، ورتبها حسب الأولوية.

التحليل:
${analysis}

## المطلوب:
قائمة بالتوصيات الاستراتيجية (5-10 توصيات)، كل واحدة في سطر واحد.
قدم كل توصية كنقطة واضحة قابلة للتنفيذ.

صيغة الإخراج:
- توصية 1
- توصية 2
- توصية 3
...
`;

    const result = await aiManager.generate(
      extractPrompt,
      { ...AI_MODELS.CLAUDE_SONNET, temperature: 0.2, maxTokens: 1000 }
    );

    const recommendations = result.content
      .split('\n')
      .filter((line: string) => line.trim().startsWith('-'))
      .map((line: string) => line.trim().substring(1).trim())
      .filter((rec: string) => rec.length > 0);

    return recommendations;
  }

  async generateQuickAnalysis(
    topic: string,
    model: 'openai' | 'anthropic' | 'gemini' = 'anthropic'
  ): Promise<AIModelResult> {
    const userPrompt = this.buildUserPrompt({ topic, keywords: [] });
    const fullPrompt = `${DEEP_ANALYSIS_GOLDEN_TEMPLATE}\n\n${userPrompt}`;
    
    const modelConfig = model === 'openai' ? AI_MODELS.GPT5 
      : model === 'gemini' ? AI_MODELS.GEMINI_FLASH 
      : AI_MODELS.CLAUDE_SONNET;

    const configWithSettings = model === 'openai' 
      ? { ...modelConfig, maxTokens: 16000 }
      : { ...modelConfig, temperature: 0.7, maxTokens: 16000 };

    const result = await aiManager.generate(
      fullPrompt,
      configWithSettings
    );

    return {
      model: result.model,
      content: result.content,
      timestamp: new Date(),
      tokensUsed: result.usage ? result.usage.inputTokens + result.usage.outputTokens : undefined,
    };
  }
}

export const deepAnalysisEngine = new DeepAnalysisEngine();
