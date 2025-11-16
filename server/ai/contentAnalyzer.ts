import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EmailContentAnalysis {
  qualityScore: number;
  language: "ar" | "en" | "ur";
  detectedCategory: string;
  hasNewsValue: boolean;
  suggestions: string[];
  issues: string[];
}

interface ContentImprovement {
  correctedText: string;
  suggestedTitle: string;
  suggestedExcerpt: string;
  suggestedCategory: string;
  seoKeywords: string[];
}

export async function analyzeEmailContent(text: string): Promise<EmailContentAnalysis> {
  try {
    console.log("[Email Analyzer] Analyzing email content...");
    console.log("[Email Analyzer] Content length:", text.length);
    
    const systemPrompt = `أنت محلل محتوى ذكي متخصص في تقييم المحتوى الصحفي المرسل عبر البريد الإلكتروني.

قم بتحليل النص المرسل وتقديم تقييم شامل يتضمن:
1. **qualityScore**: درجة الجودة من 0 إلى 100 بناءً على:
   - الوضوح والتنظيم (25 نقطة)
   - المصادر والمعلومات (25 نقطة)
   - القيمة الإخبارية (25 نقطة)
   - الدقة اللغوية (25 نقطة)

2. **language**: اللغة المستخدمة ("ar" للعربية، "en" للإنجليزية، "ur" للأردية)

3. **detectedCategory**: التصنيف المقترح للمحتوى (مثل: سياسة، اقتصاد، رياضة، تقنية، صحة، ثقافة)

4. **hasNewsValue**: هل المحتوى له قيمة إخبارية حقيقية؟ (true/false)

5. **suggestions**: قائمة بـ 3-5 اقتراحات لتحسين المحتوى

6. **issues**: قائمة بأي مشاكل في المحتوى (أخطاء إملائية، نقص معلومات، إلخ)

أعد النتيجة بصيغة JSON فقط.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `قم بتحليل المحتوى التالي:\n\n${text.substring(0, 3000)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    console.log("[Email Analyzer] Analysis completed successfully");
    console.log("[Email Analyzer] Quality score:", result.qualityScore);
    console.log("[Email Analyzer] Language:", result.language);
    console.log("[Email Analyzer] Category:", result.detectedCategory);
    
    return {
      qualityScore: result.qualityScore || 0,
      language: result.language || "ar",
      detectedCategory: result.detectedCategory || "عام",
      hasNewsValue: result.hasNewsValue !== false,
      suggestions: result.suggestions || [],
      issues: result.issues || [],
    };
  } catch (error) {
    console.error("[Email Analyzer] Error analyzing content:", error);
    throw new Error("Failed to analyze email content");
  }
}

export async function improveContent(
  text: string,
  language: "ar" | "en" | "ur" = "ar"
): Promise<ContentImprovement> {
  try {
    console.log("[Content Improver] Improving content...");
    console.log("[Content Improver] Language:", language);
    
    const SYSTEM_PROMPTS = {
      ar: `أنت محرر صحفي محترف متخصص في تحسين المحتوى الإخباري بالعربية.

مهمتك:
1. **correctedText**: تصحيح النص لغوياً ونحوياً وإملائياً، مع تحسين الأسلوب الصحفي
2. **suggestedTitle**: اقتراح عنوان جذاب ومختصر (8-12 كلمة)
3. **suggestedExcerpt**: كتابة مقدمة موجزة وجذابة (30-50 كلمة)
4. **suggestedCategory**: تحديد التصنيف الأنسب (سياسة، اقتصاد، رياضة، تقنية، صحة، ثقافة، منوعات)
5. **seoKeywords**: اقتراح 5-8 كلمات مفتاحية لتحسين محركات البحث

احرص على:
- الحفاظ على المعنى الأصلي
- استخدام لغة صحفية احترافية
- التأكد من دقة المعلومات
- جعل المحتوى جذاباً للقارئ

أعد النتيجة بصيغة JSON فقط.`,
      
      en: `You are a professional news editor specialized in improving news content in English.

Your tasks:
1. **correctedText**: Correct the text grammatically and stylistically, improving journalistic style
2. **suggestedTitle**: Suggest an attractive and concise headline (8-12 words)
3. **suggestedExcerpt**: Write a brief and engaging introduction (30-50 words)
4. **suggestedCategory**: Determine the most suitable category (Politics, Economy, Sports, Technology, Health, Culture, Miscellaneous)
5. **seoKeywords**: Suggest 5-8 keywords for SEO

Ensure:
- Preserve the original meaning
- Use professional journalistic language
- Verify accuracy of information
- Make the content engaging for readers

Return the result in JSON format only.`,
      
      ur: `آپ ایک پیشہ ور خبر ایڈیٹر ہیں جو اردو میں خبروں کے مواد کو بہتر بنانے میں مہارت رکھتے ہیں۔

آپ کے کام:
1. **correctedText**: متن کو گرامر اور اسٹائل کے لحاظ سے درست کریں، صحافتی انداز کو بہتر بنائیں
2. **suggestedTitle**: ایک پرکشش اور مختصر عنوان تجویز کریں (8-12 الفاظ)
3. **suggestedExcerpt**: ایک مختصر اور دلکش تعارف لکھیں (30-50 الفاظ)
4. **suggestedCategory**: سب سے موزوں زمرہ متعین کریں (سیاست، معیشت، کھیل، ٹیکنالوجی، صحت، ثقافت، متفرقات)
5. **seoKeywords**: SEO کے لیے 5-8 کلیدی الفاظ تجویز کریں

یقینی بنائیں:
- اصل معنی کو برقرار رکھیں
- پیشہ ورانہ صحافتی زبان استعمال کریں
- معلومات کی درستگی کی تصدیق کریں
- مواد کو قارئین کے لیے دلچسپ بنائیں

نتیجہ صرف JSON فارمیٹ میں واپس کریں۔`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS[language],
        },
        {
          role: "user",
          content: text.substring(0, 4000),
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    console.log("[Content Improver] Content improved successfully");
    console.log("[Content Improver] Suggested title:", result.suggestedTitle?.substring(0, 50));
    
    return {
      correctedText: result.correctedText || text,
      suggestedTitle: result.suggestedTitle || "",
      suggestedExcerpt: result.suggestedExcerpt || "",
      suggestedCategory: result.suggestedCategory || "عام",
      seoKeywords: result.seoKeywords || [],
    };
  } catch (error) {
    console.error("[Content Improver] Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}

export async function detectLanguage(text: string): Promise<"ar" | "en" | "ur"> {
  try {
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const urduChars = (text.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    if (arabicChars > englishChars && arabicChars > urduChars) return "ar";
    if (urduChars > arabicChars && urduChars > englishChars) return "ur";
    return "en";
  } catch (error) {
    console.error("[Language Detector] Error detecting language:", error);
    return "ar";
  }
}
