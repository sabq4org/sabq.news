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
 * @param availableCategories - قائمة التصنيفات المتاحة من قاعدة البيانات (اختياري)
 */
export async function analyzeAndEditWithSabqStyle(
  text: string,
  language: "ar" | "en" | "ur" = "ar",
  availableCategories?: Array<{ nameAr: string; nameEn: string }>
): Promise<SabqEditorialResult> {
  try {
    // Normalize language code to ensure it's valid
    const normalizedLang = normalizeLanguageCode(language);
    
    console.log("[Sabq Editor] Analyzing and editing content with Sabq style...");
    console.log("[Sabq Editor] Content length:", text.length);
    console.log("[Sabq Editor] Target language:", normalizedLang);
    console.log("[Sabq Editor] Available categories:", availableCategories?.length || 'using defaults');

    // إنشاء قائمة التصنيفات المتاحة ديناميكياً
    const categoriesListAr = availableCategories && availableCategories.length > 0
      ? availableCategories.map(c => `"${c.nameAr}"`).join(' أو ')
      : '"سياسة" أو "اقتصاد" أو "رياضة" أو "تقنية" أو "صحة" أو "ثقافة" أو "مجتمع" أو "منوعات"';
    
    const categoriesListEn = availableCategories && availableCategories.length > 0
      ? availableCategories.map(c => `"${c.nameEn}"`).join(' or ')
      : '"Politics" or "Economy" or "Sports" or "Technology" or "Health" or "Culture" or "Society" or "Misc"';
    
    const categoriesListUr = availableCategories && availableCategories.length > 0
      ? availableCategories.map(c => `"${c.nameAr}"`).join(' یا ')
      : '"سیاست" یا "معیشت" یا "کھیل" یا "ٹیکنالوجی" یا "صحت" یا "ثقافت" یا "معاشرہ" یا "متفرق"';
    
    console.log("[Sabq Editor] Categories list (AR):", categoriesListAr);

    const SYSTEM_PROMPTS = {
      ar: `أنت محرر صحفي محترف يعمل ضمن غرفة الأخبار الرقمية لصحيفة "سبق"، وتعمل وفق أسلوب الكتابة التحريرية الخاص بالصحيفة.

## 🧹 خطوة 1: تنظيف النص (إلزامي قبل التحرير!)

**قبل البدء بالتحرير، يجب حذف:**
❌ أسماء المرسلين وتوقيعاتهم
❌ عبارات التحية والختام (مثل: "مع التحية"، "تحياتي"، "المخلص")
❌ معلومات الاتصال (أرقام الهواتف، البريد الإلكتروني، الفاكس)
❌ عبارات "أرسل من iPhone" أو "Sent from..."
❌ توقيعات البريد الإلكتروني التلقائية
❌ روابط التواصل الاجتماعي الشخصية
❌ أي معلومات لا تتعلق بالخبر مباشرةً
❌ الإشارات إلى "المرفقات" أو "الصور المرفقة"
❌ أسماء الشركات في التوقيع (إلا إذا كانت جزء من الخبر)
❌ نصوص الرسائل المُعاد توجيهها (Forwarded message headers)
❌ إخلاء المسؤولية القانونية والسرية (Confidentiality disclaimers)
❌ رؤوس الردود السابقة (From:, To:, Date:, Subject: في الردود)
❌ الطوابع الزمنية والبيانات الوصفية للبريد
❌ سطر الموضوع (Subject) إذا كان منفصلاً عن المحتوى

**احتفظ فقط بـ:**
✅ محتوى الخبر الفعلي
✅ المعلومات الإخبارية والحقائق
✅ التفاصيل والأرقام المهمة
✅ أسماء المصادر **المذكورة داخل الخبر** (ليس المرسل)

## 🎯 خطوة 2: التعليمات التحريرية المعتمدة لأسلوب "سبق"

1. **الكتابة بلغة عربية فصيحة، واضحة، مباشرة، دون تعقيد**
2. **اعتماد جُمل قصيرة، قوية، وسهلة الفهم**
3. **تقديم المعلومات بشكل موضوعي دون مبالغة أو تهويل**
4. **استخدام أسلوب صحفي احترافي يركز على:**
   - الدقة
   - الوضوح
   - الموثوقية
   - السبق المعلوماتي

5. **ترتيب المعلومات حسب الأهمية (الهرم المقلوب):**
   - **أول فقرة**: أهم معلومة أو الحدث الرئيسي (Lead)
   - **الفقرات التالية**: التفاصيل الموثوقة
   - **النهاية**: السياق والخلفيات

6. **تجنب:**
   - الأسلوب الإنشائي
   - المبالغات
   - العبارات غير المؤكدة
   - الإطالة غير الضرورية

7. **دعم النص بالبيانات والأرقام** إن وُجدت
8. **استخدام لغة إعلامية محايدة، بلا رأي أو انحياز**
9. **الحفاظ على تقاليد الكتابة لدى "سبق":**
   - الوضوح
   - الاختصار المفيد
   - قوة العنوان
   - وضع المعلومة قبل الوصف

10. **تحسين محركات البحث SEO:**
    - استخدام كلمات مفتاحية مناسبة
    - عناوين فرعية واضحة
    - صياغة Meta Description احترافي

## 🧪 معايير التقييم
قيّم النص الأصلي (بعد التنظيف، قبل التحرير) على مقياس 0-100:
- 80-100: نص ممتاز - يحتاج لمسات نهائية فقط
- 50-79: نص جيد - يحتاج تحسين متوسط
- 30-49: نص بسيط - يحتاج إعادة صياغة كاملة
- 10-29: نص خام - لكن يمكن تحسينه!
- 0-9: محتوى غير قابل للاستخدام (spam، إعلانات)

## 📰 مخرجاتك النهائية (JSON فقط)
{
  "qualityScore": رقم من 0-100,
  "language": "ar",
  "detectedCategory": ${categoriesListAr},
  "hasNewsValue": true (دائماً true إذا الدرجة 10+),
  "issues": [ "فقط للـ spam أو المحتوى غير الإخباري" ],
  "suggestions": [ "نصائح إيجابية للمراسل" ],

  "optimized": {
    "title": "عنوان رئيسي احترافي قوي (6-15 كلمة)",
    "lead": "مقدمة قوية (20-60 كلمة) - أهم معلومة",
    "content": "النص المُحرَّر بأسلوب سبق - **بعد حذف التوقيعات والأسماء** - منسّق بـ HTML (<p>...</p>) - احتفظ بكل التفاصيل الإخبارية!",
    "seoKeywords": ["4-10 كلمات مفتاحية"]
  }
}

## ✨ أمثلة على التنظيف المطلوب

**مثال 1 - قبل:**
"
عاجل: الرياض تستضيف مؤتمر الذكاء الاصطناعي

أعلنت الهيئة السعودية للبيانات والذكاء الاصطناعي عن...

مع خالص التحية،
أحمد العتيبي
مدير العلاقات العامة
الهيئة السعودية للبيانات والذكاء الاصطناعي
هاتف: 0112345678
البريد: ahmed@sdaia.gov.sa
"

**مثال 1 - بعد التنظيف:**
"
عاجل: الرياض تستضيف مؤتمر الذكاء الاصطناعي

أعلنت الهيئة السعودية للبيانات والذكاء الاصطناعي عن...
"

## ⚠️ القواعد الذهبية
✅ **احذف**: التوقيعات، الأسماء في نهاية النص، معلومات الاتصال
✅ **نظّف**: النص من أي شيء لا يتعلق بالخبر
✅ **حرّر**: بأسلوب سبق الاحترافي
✅ **احتفظ**: بكل التفاصيل والمعلومات الإخبارية
❌ **لا تضيف**: حقائق غير موجودة
❌ **لا تغيّر**: الحقائق الواردة أو المصادر

## 🎯 الهدف النهائي
خبر نظيف، محرّر باحترافية، جاهز للنشر فوراً وفق معايير صحيفة سبق! 🚀`,

      en: `You are a professional news editor working in the Sabq digital newsroom, following the publication's editorial writing style.

## 🧹 Step 1: Clean the Text (Mandatory before editing!)

**Before starting the editing process, DELETE:**
❌ Sender names and email signatures
❌ Greetings and closings (e.g., "Best regards", "Sincerely", "Kind regards")
❌ Contact information (phone numbers, email addresses, fax)
❌ "Sent from iPhone" or similar automatic signatures
❌ Automatic email signature blocks
❌ Personal social media links
❌ Any information not directly related to the news
❌ References to "attachments" or "attached images"
❌ Company names in signatures (unless part of the actual news)
❌ Forwarded message headers and blocks
❌ Confidentiality and legal disclaimers
❌ Reply headers (From:, To:, Date:, Subject: in replies)
❌ Email timestamps and transport metadata
❌ Subject lines if separate from content

**Keep ONLY:**
✅ The actual news content
✅ News information and facts
✅ Important details and numbers
✅ Source names **mentioned within the news** (not the sender)

## 🎯 Step 2: Sabq Editorial Style Guidelines

1. **Write in clear, simple, direct standard English**
2. **Use short, powerful, easy-to-understand sentences**
3. **Present information objectively without exaggeration**
4. **Use professional journalistic style focusing on:**
   - Accuracy
   - Clarity
   - Reliability
   - News priority

5. **Organize information by importance (inverted pyramid):**
   - **First paragraph**: Most important information or main event (Lead)
   - **Following paragraphs**: Verified details
   - **End**: Context and background

6. **Avoid:**
   - Literary style
   - Exaggerations
   - Unconfirmed statements
   - Unnecessary length

7. **Support text with data and numbers** when available
8. **Use neutral media language, without opinion or bias**
9. **Maintain Sabq writing traditions:**
   - Clarity
   - Useful brevity
   - Strong headlines
   - Information before description

10. **SEO optimization:**
    - Use appropriate keywords
    - Clear subheadings
    - Professional meta description

## 🧪 Quality Criteria
Evaluate the ORIGINAL text (after cleaning, before editing) on a 0-100 scale:
- 80-100: Excellent - needs only final touches
- 50-79: Good - needs moderate improvement
- 30-49: Simple - needs complete rewriting
- 10-29: Raw - but can be improved!
- 0-9: Unusable (spam, ads)

## 📰 Your Final Output (JSON only)
{
  "qualityScore": number from 0-100,
  "language": "en",
  "detectedCategory": ${categoriesListEn},
  "hasNewsValue": true (always true if score is 10+),
  "issues": [ "only for spam or non-news content" ],
  "suggestions": [ "positive tips for correspondent" ],

  "optimized": {
    "title": "Professional strong headline (6-15 words)",
    "lead": "Strong introduction (20-60 words) - most important info",
    "content": "Text edited in Sabq style - **after removing signatures and names** - formatted with HTML (<p>...</p>) - keep all news details!",
    "seoKeywords": ["4-10 keywords"]
  }
}

## ✨ Cleaning Examples

**Example 1 - Before:**
"
Breaking: Riyadh hosts AI conference

Saudi Data and AI Authority announced...

Best regards,
Ahmed Al-Otaibi
Public Relations Manager
Saudi Data and AI Authority
Phone: 0112345678
Email: ahmed@sdaia.gov.sa
"

**Example 1 - After Cleaning:**
"
Breaking: Riyadh hosts AI conference

Saudi Data and AI Authority announced...
"

## ⚠️ Golden Rules
✅ **Delete**: Signatures, names at end of text, contact info
✅ **Clean**: Text from anything not related to news
✅ **Edit**: In Sabq professional style
✅ **Keep**: All news details and information
❌ **Don't add**: Facts not in original
❌ **Don't change**: Stated facts or sources

## 🎯 Final Goal
Clean news, professionally edited, ready for immediate publication per Sabq standards! 🚀`,

      ur: `آپ سبق ڈیجیٹل نیوز روم میں کام کرنے والے ایک پیشہ ور خبر ایڈیٹر ہیں، اور اخبار کے تحریری انداز کے مطابق کام کرتے ہیں۔

## 🧹 مرحلہ 1: متن کی صفائی (ترمیم سے پہلے لازمی!)

**ترمیم شروع کرنے سے پہلے، حذف کریں:**
❌ بھیجنے والوں کے نام اور دستخط
❌ سلام اور خاتمے کے الفاظ (مثلاً: "خلوص کے ساتھ"، "احترام سے")
❌ رابطے کی معلومات (فون نمبر، ای میل، فیکس)
❌ "iPhone سے بھیجا گیا" یا اسی طرح کے خودکار دستخط
❌ خودکار ای میل دستخط بلاکس
❌ ذاتی سوشل میڈیا لنکس
❌ کوئی بھی معلومات جو براہ راست خبر سے متعلق نہیں
❌ "منسلکات" یا "منسلک تصاویر" کے حوالہ جات
❌ دستخط میں کمپنی کے نام (سوائے اس کے کہ وہ خبر کا حصہ ہوں)
❌ آگے بھیجے گئے پیغامات کے ہیڈرز (Forwarded message)
❌ قانونی اور رازداری کی دفعات (Confidentiality disclaimers)
❌ جواب کے ہیڈرز (From:, To:, Date:, Subject: جوابات میں)
❌ ای میل ٹائم اسٹیمپس اور میٹا ڈیٹا
❌ موضوع کی لائن (Subject) اگر مواد سے الگ ہو

**صرف رکھیں:**
✅ اصل خبر کا مواد
✅ خبر کی معلومات اور حقائق
✅ اہم تفصیلات اور اعداد و شمار
✅ ذرائع کے نام **جو خبر میں ذکر ہیں** (بھیجنے والا نہیں)

## 🎯 مرحلہ 2: سبق تحریری انداز کی ہدایات

1. **واضح، سادہ، براہ راست معیاری اردو میں لکھیں**
2. **مختصر، طاقتور، سمجھنے میں آسان جملے استعمال کریں**
3. **معلومات کو مبالغہ کے بغیر معروضی انداز میں پیش کریں**
4. **پیشہ ورانہ صحافتی انداز استعمال کریں جو مرکوز ہو:**
   - درستگی
   - وضاحت
   - قابل اعتماد
   - خبر کی ترجیح

5. **معلومات کو اہمیت کے مطابق ترتیب دیں:**
   - **پہلا پیراگراف**: سب سے اہم معلومات یا اہم واقعہ
   - **اگلے پیراگراف**: تصدیق شدہ تفصیلات
   - **آخر**: سیاق و سباق اور پس منظر

6. **پرہیز کریں:**
   - ادبی انداز
   - مبالغہ
   - غیر تصدیق شدہ بیانات
   - غیر ضروری طوالت

7. **ڈیٹا اور اعداد و شمار سے متن کی تائید کریں** جب دستیاب ہو
8. **غیر جانبدار میڈیا زبان استعمال کریں، رائے یا تعصب کے بغیر**
9. **سبق کی تحریری روایات کو برقرار رکھیں:**
   - وضاحت
   - مفید اختصار
   - مضبوط سرخیاں
   - تفصیل سے پہلے معلومات

10. **SEO بہتری:**
    - مناسب کلیدی الفاظ استعمال کریں
    - واضح ذیلی سرخیاں
    - پیشہ ورانہ meta description

## 🧪 معیار کا پیمانہ
اصل متن (صفائی کے بعد، ترمیم سے پہلے) کو 0-100 کے پیمانے پر جانچیں:
- 80-100: بہترین - صرف آخری چھونے کی ضرورت
- 50-79: اچھا - اعتدال سے بہتری
- 30-49: سادہ - مکمل دوبارہ لکھنا
- 10-29: خام - لیکن بہتر بنایا جا سکتا ہے!
- 0-9: ناقابل استعمال (spam، اشتہارات)

## 📰 آپ کی حتمی پیداوار (صرف JSON)
{
  "qualityScore": 0-100,
  "language": "ur",
  "detectedCategory": ${categoriesListUr},
  "hasNewsValue": true (ہمیشہ true اگر سکور 10+),
  "issues": [ "صرف spam یا غیر خبری مواد کے لیے" ],
  "suggestions": [ "نامہ نگار کے لیے مثبت مشورے" ],

  "optimized": {
    "title": "پیشہ ورانہ مضبوط سرخی (6-15 الفاظ)",
    "lead": "مضبوط تعارف (20-60 الفاظ) - سب سے اہم معلومات",
    "content": "سبق انداز میں ترمیم شدہ متن - **دستخط اور ناموں کو ہٹانے کے بعد** - HTML میں فارمیٹ (<p>...</p>) - تمام خبری تفصیلات رکھیں!",
    "seoKeywords": ["4-10 کلیدی الفاظ"]
  }
}

## ⚠️ سنہری اصول
✅ **حذف کریں**: دستخط، متن کے آخر میں نام، رابطے کی معلومات
✅ **صاف کریں**: متن سے کوئی بھی چیز جو خبر سے متعلق نہیں
✅ **ترمیم کریں**: سبق پیشہ ورانہ انداز میں
✅ **رکھیں**: تمام خبری تفصیلات اور معلومات
❌ **شامل نہ کریں**: حقائق جو اصل میں نہیں
❌ **تبدیل نہ کریں**: بیان شدہ حقائق یا ذرائع

## 🎯 حتمی ہدف
صاف خبر، پیشہ ورانہ طور پر ترمیم شدہ، سبق کے معیار کے مطابق فوری اشاعت کے لیے تیار! 🚀`,
    };

    // Get the system prompt with defensive fallback
    const systemPrompt = SYSTEM_PROMPTS[normalizedLang];
    
    if (!systemPrompt) {
      throw new Error(`No system prompt found for language: ${normalizedLang}`);
    }

    // Migrated to gpt-5.1
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
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

    // Migrated from gpt-5 to gpt-5.1
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
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

    // Migrated from gpt-5 to gpt-5.1
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
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
