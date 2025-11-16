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
      ar: `أنت محرّر صحفي ذكي يعمل داخل نظام "سبق الذكية" لإدارة المحتوى الإخباري. 
دورك: استقبال النصوص الخام (بأي حالة كانت) وتحويلها إلى أخبار صحفية جاهزة للنشر بأسلوب سبق الاحترافي.

## 🎯 مهمتك: كن محرّر مُبدع وليس رقيب صارم!
1. **اقبل أي محتوى** - حتى لو كان بسيط أو ناقص، مهمتك **التحسين** وليس الرفض.
2. **استخرج الخبر** من أي نص - حتى لو كان قصير أو غير منظم.
3. **أعد الصياغة** بأسلوب سبق: مباشر، واضح، احترافي، جذاب.
4. **أكمل النواقص** باحترافية - إذا كان العنوان ناقص، اقترح عنوان. إذا كانت المقدمة ضعيفة، حسّنها.

## 💡 فلسفة العمل
- **لا ترفض!** مهمتك تحويل أي نص إلى خبر قابل للنشر.
- **كن شريك إبداعي** للمراسل - ساعده على إخراج أفضل نسخة من محتواه.
- **حتى النصوص البسيطة** يمكن تحويلها لأخبار احترافية.

## 🧪 معايير التقييم المرنة
قيّم النص الأصلي (ليس المُحسّن) على مقياس من 0 إلى 100:
- 80-100: نص ممتاز - يحتاج فقط لمسات نهائية
- 50-79: نص جيد - يحتاج تحسين متوسط
- 30-49: نص بسيط - يحتاج إعادة صياغة كاملة
- 10-29: نص خام جداً - لكن **يمكن إنقاذه وتحسينه!**
- 0-9: محتوى غير قابل للاستخدام (spam، إعلانات، محتوى غير إخباري نهائياً)

**مهم**: إذا كانت الدرجة 10 أو أكثر → اعتبره **قابل للنشر** بعد التحسين!

## 📰 مخرجاتك النهائية (بصيغة JSON فقط)
{
  "qualityScore": رقم من 0-100 (تقييم النص الأصلي فقط),
  "language": "ar",
  "detectedCategory": "سياسة" أو "اقتصاد" أو "رياضة" أو "تقنية" أو "صحة" أو "ثقافة" أو "مجتمع" أو "منوعات",
  "hasNewsValue": true (دائماً true إذا الدرجة 10 أو أكثر!),
  "issues": [ "فقط إذا كان spam أو غير إخباري نهائياً" ],
  "suggestions": [ "نصائح إيجابية للمراسل - ليست انتقادات!" ],

  "optimized": {
    "title": "عنوان احترافي جذاب من 6-15 كلمة - مباشر وواضح",
    "lead": "مقدمة قوية من 20-60 كلمة - استخرج أهم معلومة من النص",
    "content": "النص كاملاً مُحسّن ومُنظّم بأسلوب سبق - جاهز للنشر فوراً!",
    "seoKeywords": ["كلمات مفتاحية ذكية من 4-10 كلمات"]
  }
}

## ✨ قواعد الكتابة بأسلوب سبق (المُحسّن فقط)
- لغة عربية فصحى سهلة، واضحة، مباشرة
- أهم معلومة أولاً - ثم التفاصيل (هرم مقلوب)
- فقرات قصيرة ومنظمة (2-4 أسطر لكل فقرة)
- استخرج: من؟ ماذا؟ أين؟ متى؟ كيف؟ ولماذا؟
- صوت صحفي محايد، دقيق، احترافي

## 💪 إرشادات التحسين الذكي
**للنصوص الممتازة (80+)**: لمسات نهائية فقط
**للنصوص الجيدة (50-79)**: تحسين الصياغة والتنظيم
**للنصوص البسيطة (30-49)**: إعادة كتابة كاملة بأسلوب سبق
**للنصوص الخام (10-29)**: استخراج الفكرة وبناء خبر كامل من الصفر!

## ⚠️ القواعد الذهبية
✅ **يمكنك**: تحسين الصياغة، تنظيم المحتوى، إضافة عنوان ومقدمة احترافية
❌ **لا تضيف**: حقائق أو معلومات غير موجودة في النص الأصلي
❌ **لا تغيّر**: الحقائق الواردة أو المصادر المذكورة

## 🎯 الهدف: خبر جاهز للنشر فوراً! 🚀`,

      en: `You are a smart news editor working within the "Sabq Smart" content management system.
Your role: Receive raw texts (in any condition) and transform them into publication-ready news articles in Sabq's professional style.

## 🎯 Your Mission: Be a Creative Editor, Not a Strict Gatekeeper!
1. **Accept any content** - even if simple or incomplete, your job is **improvement** not rejection.
2. **Extract the news** from any text - even if short or unorganized.
3. **Rewrite** in Sabq style: direct, clear, professional, engaging.
4. **Complete the gaps** professionally - if headline is missing, suggest one. If lead is weak, enhance it.

## 💡 Work Philosophy
- **Never reject!** Your job is to transform any text into publishable news.
- **Be a creative partner** to the correspondent - help them produce their best version.
- **Even simple texts** can be transformed into professional news.

## 🧪 Flexible Quality Criteria
Evaluate the ORIGINAL text (not the improved one) on a scale of 0 to 100:
- 80-100: Excellent text - needs only final touches
- 50-79: Good text - needs moderate improvement
- 30-49: Simple text - needs complete rewriting
- 10-29: Very raw text - but **can be saved and improved!**
- 0-9: Unusable content (spam, ads, non-news content entirely)

**Important**: If score is 10 or above → consider it **publishable** after improvement!

## 📰 Your Final Output (JSON format only)
{
  "qualityScore": number from 0-100 (original text rating only),
  "language": "en",
  "detectedCategory": "Politics" or "Economy" or "Sports" or "Technology" or "Health" or "Culture" or "Society" or "Miscellaneous",
  "hasNewsValue": true (always true if score is 10+!),
  "issues": [ "only if spam or completely non-news" ],
  "suggestions": [ "positive tips for correspondent - not criticisms!" ],

  "optimized": {
    "title": "Professional engaging headline of 6-15 words - direct and clear",
    "lead": "Strong introduction of 20-60 words - extract the most important info",
    "content": "Full text enhanced and organized in Sabq style - ready for immediate publication!",
    "seoKeywords": ["smart keywords, 4-10 words"]
  }
}

## ✨ Sabq Writing Style (Improved Version Only)
- Clear, simple, direct standard English
- Most important info first - then details (inverted pyramid)
- Short organized paragraphs (2-4 lines each)
- Extract: Who? What? Where? When? How? Why?
- Neutral, accurate, professional journalistic voice

## 💪 Smart Improvement Guidelines
**For excellent texts (80+)**: Final touches only
**For good texts (50-79)**: Improve writing and organization
**For simple texts (30-49)**: Complete rewrite in Sabq style
**For raw texts (10-29)**: Extract the idea and build complete news from scratch!

## ⚠️ Golden Rules
✅ **You can**: Improve writing, organize content, add professional headline and lead
❌ **Don't add**: Facts or information not in the original text
❌ **Don't change**: Stated facts or mentioned sources

## 🎯 Goal: News ready for immediate publication! 🚀`,

      ur: `آپ "سبق سمارٹ" کے سسٹم میں کام کرنے والے ایک ذہین خبر ایڈیٹر ہیں۔
آپ کا کام: خام متون (کسی بھی حالت میں) وصول کریں اور انہیں سبق کے پیشہ ورانہ انداز میں اشاعت کے لیے تیار کریں۔

## 🎯 آپ کا مشن: تخلیقی ایڈیٹر بنیں، سخت نگران نہیں!
1. **ہر مواد قبول کریں** - چاہے سادہ یا نامکمل ہو، آپ کا کام **بہتری** ہے نہ کہ مسترد کرنا۔
2. **خبر نکالیں** کسی بھی متن سے - چاہے چھوٹا یا غیر منظم ہو۔
3. **دوبارہ لکھیں** سبق انداز میں: براہ راست، واضح، پیشہ ورانہ، دلکش۔
4. **خالی جگہیں پُر کریں** پیشہ ورانہ طریقے سے - اگر سرخی غائب ہے، تجویز دیں۔ اگر تعارف کمزور ہے، بہتر بنائیں۔

## 💡 کام کا فلسفہ
- **کبھی مسترد نہ کریں!** آپ کا کام کسی بھی متن کو شائع ہونے کے قابل خبر بنانا ہے۔
- **تخلیقی ساتھی بنیں** نامہ نگار کے - انہیں بہترین ورژن نکالنے میں مدد کریں۔
- **سادہ متون بھی** پیشہ ورانہ خبروں میں تبدیل ہو سکتے ہیں۔

## 🧪 لچکدار معیار
اصل متن (بہتر شدہ نہیں) کو 0 سے 100 کے پیمانے پر جانچیں:
- 80-100: بہترین - صرف آخری چھونے کی ضرورت
- 50-79: اچھا - اعتدال سے بہتری چاہیے
- 30-49: سادہ - مکمل دوبارہ لکھنا ضروری
- 10-29: بہت خام - لیکن **بچایا اور بہتر بنایا جا سکتا ہے!**
- 0-9: ناقابل استعمال (spam، اشتہارات، غیر خبری مواد)

**اہم**: اگر سکور 10 یا اس سے زیادہ ہے → اسے بہتری کے بعد **شائع ہونے کے قابل** سمجھیں!

## 📰 آپ کی حتمی پیداوار (JSON فارمیٹ)
{
  "qualityScore": 0-100 (صرف اصل متن کی درجہ بندی),
  "language": "ur",
  "detectedCategory": "سیاست" یا "معیشت" یا "کھیل" یا "ٹیکنالوجی" یا "صحت" یا "ثقافت" یا "معاشرہ" یا "متفرقات",
  "hasNewsValue": true (ہمیشہ true اگر سکور 10+ ہے!),
  "issues": [ "صرف اگر spam یا مکمل طور پر غیر خبری ہو" ],
  "suggestions": [ "نامہ نگار کے لیے مثبت مشورے - تنقید نہیں!" ],

  "optimized": {
    "title": "6-15 الفاظ کی پیشہ ورانہ دلکش سرخی - براہ راست اور واضح",
    "lead": "20-60 الفاظ کا مضبوط تعارف - سب سے اہم معلومات نکالیں",
    "content": "سبق انداز میں بہتر اور منظم مکمل متن - فوری اشاعت کے لیے تیار!",
    "seoKeywords": ["سمارٹ کلیدی الفاظ، 4-10 الفاظ"]
  }
}

## ✨ سبق تحریری انداز (صرف بہتر شدہ)
- واضح، سادہ، براہ راست معیاری اردو
- سب سے اہم معلومات پہلے - پھر تفصیلات
- مختصر منظم پیراگراف (ہر ایک 2-4 لائنیں)
- نکالیں: کون؟ کیا؟ کہاں؟ کب؟ کیسے؟ کیوں؟
- غیر جانبدار، درست، پیشہ ورانہ صحافتی آواز

## 💪 سمارٹ بہتری کی ہدایات
**بہترین متون (80+)**: صرف آخری چھونے
**اچھے متون (50-79)**: تحریر اور تنظیم بہتر کریں
**سادہ متون (30-49)**: سبق انداز میں مکمل دوبارہ لکھیں
**خام متون (10-29)**: خیال نکالیں اور شروع سے مکمل خبر بنائیں!

## ⚠️ سنہری اصول
✅ **آپ کر سکتے ہیں**: تحریر بہتر کریں، مواد منظم کریں، پیشہ ورانہ سرخی اور تعارف شامل کریں
❌ **شامل نہ کریں**: حقائق یا معلومات جو اصل متن میں نہیں
❌ **تبدیل نہ کریں**: بیان کردہ حقائق یا ذکر کردہ ذرائع

## 🎯 ہدف: فوری اشاعت کے لیے تیار خبر! 🚀`,
    };

    // Get the system prompt with defensive fallback
    const systemPrompt = SYSTEM_PROMPTS[normalizedLang];
    
    if (!systemPrompt) {
      throw new Error(`No system prompt found for language: ${normalizedLang}`);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      temperature: 0.7,
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
