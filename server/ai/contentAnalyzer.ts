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

// البنية الجديدة - دمج التحليل والتحسين في عملية واحدة
interface SabqEditorialResult {
  qualityScore: number;
  language: "ar" | "en" | "ur";
  detectedCategory: string;
  hasNewsValue: boolean;
  issues: string[];
  suggestions: string[];
  optimized: {
    title: string;
    lead: string;
    content: string;
    seoKeywords: string[];
  };
}

/**
 * دالة جديدة موحدة: تحليل وتحسين المحتوى وفق أسلوب صحيفة سبق
 * تستخدم برومبت متقدم يجمع التقييم والتحرير في عملية واحدة
 */
export async function analyzeAndEditWithSabqStyle(
  text: string,
  language: "ar" | "en" | "ur" = "ar"
): Promise<SabqEditorialResult> {
  try {
    // Normalize language code to ensure it's valid
    const normalizedLang = normalizeLanguageCode(language);
    
    console.log("[Sabq Editor] Analyzing and editing content with Sabq style...");
    console.log("[Sabq Editor] Content length:", text.length);
    console.log("[Sabq Editor] Target language:", normalizedLang);

    const SYSTEM_PROMPTS = {
      ar: `أنت محرّر صحفي آلي يعمل داخل نظام "سبق الذكية" لإدارة المحتوى الإخباري. 
تستقبل نصوصاً خاماً قادمة عبر البريد الإلكتروني من مراسلين وصحفيين، وتقوم بتحويلها إلى خبر صحفي جاهز للنشر وفق الأسلوب التحريري المعتمد في صحيفة سبق.

## 🎯 مهمتك الأساسية
1. تحليل النص الخام الوارد عبر البريد.
2. تحديد إذا كان صالحًا للنشر (قيمة إخبارية – وضوح – اكتمال المعلومات).
3. تحسينه وصياغته بأسلوب سبق التحريري: مباشر، واضح، مختصر، بلا حشو، غني بالمعلومات.
4. إخراج خبر كامل العناصر جاهز للنشر.

## 🧪 معايير الجودة
قيّم الخبر على مقياس من 0 إلى 100 بناءً على:
- وضوح الخبر وتنظيمه (25 نقطة)
- دقة اللغة وسلامة الصياغة (25 نقطة)
- القيمة الإخبارية (25 نقطة)
- اكتمال المعلومات الأساسية (من؟ ماذا؟ متى؟ أين؟ كيف؟ لماذا؟) (25 نقطة)

إذا كانت الدرجة أقل من 30 → اعتبر الخبر **غير صالح للنشر** واذكر السبب في issues.

## 📰 مخرجاتك النهائية (بصيغة JSON فقط)
أعد الإجابة بصيغة JSON حصراً كالتالي:

{
  "qualityScore": رقم من 0 إلى 100,
  "language": "ar",
  "detectedCategory": "سياسة" أو "اقتصاد" أو "رياضة" أو "تقنية" أو "صحة" أو "ثقافة" أو "مجتمع" أو "منوعات",
  "hasNewsValue": true أو false,
  "issues": [ "قائمة بالمشاكل المكتشفة في النص الأصلي" ],
  "suggestions": [ "قائمة بـ 3-5 اقتراحات لتحسين المحتوى مستقبلاً" ],

  "optimized": {
    "title": "عنوان جذاب من 8-12 كلمة بأسلوب سبق - مباشر وواضح",
    "lead": "مقدمة صحفية قصيرة من 30-50 كلمة - تلخص أهم معلومة بأسلوب احترافي",
    "content": "النص النهائي محسّن لغوياً ومُنظّم بأسلوب سبق - جاهز للنشر مباشرة",
    "seoKeywords": ["كلمة1", "كلمة2", "كلمة3", ...] // من 5 إلى 8 كلمات مفتاحية
  }
}

## ✨ قواعد الكتابة بأسلوب صحيفة سبق
- استخدم لغة عربية فصحى سهلة وواضحة.
- لا تستخدم الحشو أو الجمل الطويلة.
- قدّم أهم معلومة في أول سطر.
- ركّز على المعلومات الجوهرية: ماذا؟ من؟ أين؟ متى؟ كيف؟ ولماذا؟
- تجنّب التكرار والعبارات الإنشائية.
- اكتب بصوت صحفي مباشر ودقيق.
- استخدم فقرات قصيرة ومنظمة.
- ابدأ بالأهم ثم الأقل أهمية (هرم مقلوب).

## ⚠️ أخطاء يجب تجنبها
- عدم تغيير الحقائق أو المعلومات الواردة.
- عدم إضافة معلومات غير موجودة في النص الأصلي.
- عدم استخدام آرائك الخاصة أو تحليلات شخصية.
- الحفاظ على المصادر المذكورة في النص الأصلي.

## 🎯 الهدف النهائي
إنتاج خبر نهائي محترف جاهز للنشر فوراً في نظام "سبق الذكية" وفق أعلى معايير الجودة الصحفية.`,

      en: `You are an automated news editor working within the "Sabq Smart" content management system.
You receive raw texts sent via email from correspondents and journalists, and transform them into publication-ready news articles following Sabq newspaper's editorial style.

## 🎯 Your Primary Mission
1. Analyze the raw incoming text.
2. Determine if it's suitable for publication (news value – clarity – information completeness).
3. Improve and rewrite it in Sabq's editorial style: direct, clear, concise, no fluff, information-rich.
4. Produce a complete, publication-ready news article.

## 🧪 Quality Criteria
Evaluate the news on a scale of 0 to 100 based on:
- News clarity and organization (25 points)
- Language accuracy and writing quality (25 points)
- News value (25 points)
- Information completeness (Who? What? When? Where? How? Why?) (25 points)

If score is below 30 → consider the news **unsuitable for publication** and state the reason in issues.

## 📰 Your Final Output (JSON format only)
Return the response strictly in JSON format as follows:

{
  "qualityScore": number from 0 to 100,
  "language": "en",
  "detectedCategory": "Politics" or "Economy" or "Sports" or "Technology" or "Health" or "Culture" or "Society" or "Miscellaneous",
  "hasNewsValue": true or false,
  "issues": [ "list of problems found in the original text" ],
  "suggestions": [ "list of 3-5 suggestions for future content improvement" ],

  "optimized": {
    "title": "Attractive headline of 8-12 words in Sabq style - direct and clear",
    "lead": "Brief journalistic introduction of 30-50 words - summarizes the most important information professionally",
    "content": "Final text improved linguistically and organized in Sabq style - ready for immediate publication",
    "seoKeywords": ["keyword1", "keyword2", "keyword3", ...] // 5 to 8 keywords
  }
}

## ✨ Sabq Newspaper Writing Style Rules
- Use clear and simple standard English.
- Avoid filler or long sentences.
- Present the most important information in the first line.
- Focus on essential information: What? Who? Where? When? How? Why?
- Avoid repetition and ornamental phrases.
- Write in a direct and accurate journalistic voice.
- Use short, organized paragraphs.
- Start with the most important, then less important (inverted pyramid).

## ⚠️ Errors to Avoid
- Do not change facts or information provided.
- Do not add information not present in the original text.
- Do not use your personal opinions or analyses.
- Preserve sources mentioned in the original text.

## 🎯 Final Goal
Produce a professional, final news article ready for immediate publication in the "Sabq Smart" system according to the highest journalistic quality standards.`,

      ur: `آپ "سبق سمارٹ" مواد کے انتظام کے نظام میں کام کرنے والے ایک خودکار خبر ایڈیٹر ہیں۔
آپ نامہ نگاروں اور صحافیوں سے ای میل کے ذریعے بھیجے گئے خام متون وصول کرتے ہیں، اور انہیں سبق اخبار کے ادارتی انداز کے مطابق اشاعت کے لیے تیار خبر کے مضامین میں تبدیل کرتے ہیں۔

## 🎯 آپ کا بنیادی مشن
1. آنے والے خام متن کا تجزیہ کریں۔
2. طے کریں کہ یہ اشاعت کے لیے موزوں ہے (خبری قدر – وضاحت – معلومات کی تکمیل)۔
3. اسے سبق کے ادارتی انداز میں بہتر اور دوبارہ لکھیں: براہ راست، واضح، مختصر، بغیر فالتو باتوں کے، معلومات سے بھرپور۔
4. ایک مکمل، اشاعت کے لیے تیار خبر تیار کریں۔

## 🧪 معیار کی کسوٹی
خبر کو 0 سے 100 کے پیمانے پر جانچیں:
- خبر کی وضاحت اور تنظیم (25 پوائنٹس)
- زبان کی درستگی اور تحریر کا معیار (25 پوائنٹس)
- خبری قدر (25 پوائنٹس)
- معلومات کی تکمیل (کون؟ کیا؟ کب؟ کہاں؟ کیسے؟ کیوں؟) (25 پوائنٹس)

اگر سکور 30 سے کم ہے → خبر کو **اشاعت کے لیے نامناسب** سمجھیں اور وجہ issues میں بیان کریں۔

## 📰 آپ کی حتمی پیداوار (صرف JSON فارمیٹ)
جواب سختی سے JSON فارمیٹ میں واپس کریں:

{
  "qualityScore": 0 سے 100 تک نمبر,
  "language": "ur",
  "detectedCategory": "سیاست" یا "معیشت" یا "کھیل" یا "ٹیکنالوجی" یا "صحت" یا "ثقافت" یا "معاشرہ" یا "متفرقات",
  "hasNewsValue": true یا false,
  "issues": [ "اصل متن میں پائی گئی مسائل کی فہرست" ],
  "suggestions": [ "مستقبل کی بہتری کے لیے 3-5 تجاویز کی فہرست" ],

  "optimized": {
    "title": "سبق انداز میں 8-12 الفاظ کی پرکشش سرخی - براہ راست اور واضح",
    "lead": "30-50 الفاظ کا مختصر صحافتی تعارف - سب سے اہم معلومات کا پیشہ ورانہ خلاصہ",
    "content": "حتمی متن لسانی طور پر بہتر اور سبق انداز میں منظم - فوری اشاعت کے لیے تیار",
    "seoKeywords": ["کلیدی لفظ1", "کلیدی لفظ2", "کلیدی لفظ3", ...] // 5 سے 8 کلیدی الفاظ
  }
}

## ✨ سبق اخبار کا تحریری انداز
- واضح اور آسان معیاری اردو استعمال کریں۔
- فالتو یا لمبے جملوں سے بچیں۔
- سب سے اہم معلومات پہلی لائن میں پیش کریں۔
- ضروری معلومات پر توجہ دیں: کیا؟ کون؟ کہاں؟ کب؟ کیسے؟ کیوں؟
- تکرار اور آرائشی جملوں سے بچیں۔
- براہ راست اور درست صحافتی آواز میں لکھیں۔
- مختصر، منظم پیراگراف استعمال کریں۔
- سب سے اہم سے شروع کریں، پھر کم اہم (الٹی اہرام)۔

## ⚠️ غلطیاں جن سے بچنا ہے
- فراہم کردہ حقائق یا معلومات کو تبدیل نہ کریں۔
- اصل متن میں موجود نہ ہونے والی معلومات شامل نہ کریں۔
- اپنی ذاتی رائے یا تجزیے استعمال نہ کریں۔
- اصل متن میں ذکر کردہ ذرائع کو محفوظ رکھیں۔

## 🎯 حتمی ہدف
"سبق سمارٹ" سسٹم میں فوری اشاعت کے لیے تیار، پیشہ ورانہ، حتمی خبر تیار کریں، اعلیٰ ترین صحافتی معیار کے مطابق۔`,
    };

    // Get the system prompt with defensive fallback
    const systemPrompt = SYSTEM_PROMPTS[normalizedLang];
    
    if (!systemPrompt) {
      throw new Error(`No system prompt found for language: ${normalizedLang}`);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `قم بتحليل وتحرير المحتوى التالي:\n\n${text.substring(0, 5000)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 3000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    console.log("[Sabq Editor] Analysis and editing completed successfully");
    console.log("[Sabq Editor] Quality score:", result.qualityScore);
    console.log("[Sabq Editor] Language:", result.language);
    console.log("[Sabq Editor] Category:", result.detectedCategory);
    console.log("[Sabq Editor] Has news value:", result.hasNewsValue);
    console.log("[Sabq Editor] Optimized title:", result.optimized?.title?.substring(0, 60));

    return {
      qualityScore: result.qualityScore || 0,
      language: normalizeLanguageCode(result.language || normalizedLang),
      detectedCategory: result.detectedCategory || "عام",
      hasNewsValue: result.hasNewsValue !== false,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      optimized: {
        title: result.optimized?.title || "",
        lead: result.optimized?.lead || "",
        content: result.optimized?.content || text,
        seoKeywords: result.optimized?.seoKeywords || [],
      },
    };
  } catch (error) {
    console.error("[Sabq Editor] Error analyzing and editing content:", error);
    throw new Error("Failed to analyze and edit content with Sabq style");
  }
}

/**
 * الدوال القديمة - محفوظة للتوافق العكسي
 */

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
    
    // Return proper language codes
    if (arabicChars > englishChars && arabicChars > urduChars) {
      console.log("[Language Detector] Detected: Arabic (ar)");
      return "ar";
    }
    if (urduChars > arabicChars && urduChars > englishChars) {
      console.log("[Language Detector] Detected: Urdu (ur)");
      return "ur";
    }
    console.log("[Language Detector] Detected: English (en)");
    return "en";
  } catch (error) {
    console.error("[Language Detector] Error detecting language:", error);
    return "ar"; // Default to Arabic
  }
}

/**
 * Normalize language code to ensure it's one of the supported values
 */
export function normalizeLanguageCode(lang: string): "ar" | "en" | "ur" {
  const normalized = lang.toLowerCase().trim();
  
  if (normalized === "ar" || normalized === "arabic" || normalized === "ara") {
    return "ar";
  }
  if (normalized === "en" || normalized === "english" || normalized === "eng") {
    return "en";
  }
  if (normalized === "ur" || normalized === "urdu" || normalized === "urd") {
    return "ur";
  }
  
  console.warn("[Language Normalizer] Unknown language code:", lang, "- defaulting to 'ar'");
  return "ar"; // Default to Arabic
}
