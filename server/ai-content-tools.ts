import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const genai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
});

export async function summarizeText(
  text: string,
  language: "ar" | "en" | "ur" = "ar"
): Promise<{ summary: string; wordCount: number; compressionRate: number }> {
  console.log(`📝 [AI Tools] Summarizing text in ${language}`);

  try {
    const originalWordCount = text.trim().split(/\s+/).length;
    const targetWordCount = Math.ceil(originalWordCount * 0.3);

    const languageInstructions = {
      ar: "اكتب الملخص بالعربية الفصحى",
      en: "Write the summary in English",
      ur: "اردو میں خلاصہ لکھیں",
    };

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `أنت خبير تلخيص محترف. قم بتلخيص النص التالي مع الالتزام بالمعايير:

📏 المعايير:
- الطول المستهدف: ${targetWordCount} كلمة تقريباً (30% من النص الأصلي)
- ${languageInstructions[language]}
- احتفظ بجميع النقاط الرئيسية والمعلومات المهمة
- استخدم لغة واضحة ومباشرة
- احتفظ بالأسماء والأرقام والتواريخ الدقيقة
- تجنب الحشو والتكرار

📄 النص الأصلي:
${text}

قدم الملخص فقط بدون أي مقدمات أو عناوين.`,
        },
      ],
    });

    const summary =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "";

    const summaryWordCount = summary.split(/\s+/).length;
    const compressionRate = Math.round(
      ((originalWordCount - summaryWordCount) / originalWordCount) * 100
    );

    console.log(
      `✅ [AI Tools] Summarized ${originalWordCount} words → ${summaryWordCount} words (${compressionRate}% compression)`
    );

    return {
      summary,
      wordCount: summaryWordCount,
      compressionRate,
    };
  } catch (error) {
    console.error(`❌ [AI Tools] Summarization failed:`, error);
    throw new Error("فشل تلخيص النص. يرجى المحاولة مرة أخرى");
  }
}

export async function generateSocialPost(
  articleTitle: string,
  articleSummary: string,
  platform: "twitter" | "facebook" | "linkedin"
): Promise<{ post: string; hashtags: string[]; characterCount: number }> {
  console.log(`📱 [AI Tools] Generating ${platform} post`);

  try {
    const platformSpecs = {
      twitter: {
        maxLength: 280,
        style: "قصير وجذاب ومباشر مع هاشتاغات قوية",
        tone: "سريع وملفت للانتباه",
      },
      facebook: {
        maxLength: 500,
        style: "جذاب وتفاعلي مع دعوة للتفاعل",
        tone: "ودود وشخصي",
      },
      linkedin: {
        maxLength: 700,
        style: "احترافي ومعلوماتي مع رؤية متعمقة",
        tone: "رسمي ومهني",
      },
    };

    const spec = platformSpecs[platform];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت مختص في إنشاء محتوى وسائل التواصل الاجتماعي لصحيفة "سبق".`,
        },
        {
          role: "user",
          content: `أنشئ منشور ${platform} احترافي عن الخبر التالي:

📰 العنوان: ${articleTitle}
📝 الملخص: ${articleSummary}

📱 معايير ${platform}:
- الحد الأقصى: ${spec.maxLength} حرف
- الأسلوب: ${spec.style}
- النبرة: ${spec.tone}
- اللغة: العربية

⚠️ متطلبات:
1. لا تتجاوز ${spec.maxLength} حرف أبداً
2. أضف 2-3 هاشتاغات ذات صلة في نهاية المنشور
3. لا تستخدم emoji أو رموز تعبيرية نهائياً
4. اكتب بأسلوب ${spec.tone}
5. استخدم نص عربي احترافي فقط

قدم الإجابة بصيغة JSON:
{
  "post": "نص المنشور كامل مع الهاشتاغات",
  "hashtags": ["هاشتاغ1", "هاشتاغ2", "هاشتاغ3"]
}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("فشل في استخراج المنشور من الاستجابة");
    }

    const result = JSON.parse(jsonMatch[0]);

    if (!result.post || result.post.length > spec.maxLength) {
      console.warn(
        `⚠️ Post length: ${result.post?.length || 0} exceeds ${spec.maxLength}`
      );
      result.post = result.post?.substring(0, spec.maxLength - 3) + "...";
    }

    console.log(
      `✅ [AI Tools] Generated ${platform} post (${result.post.length} chars)`
    );

    return {
      post: result.post,
      hashtags: result.hashtags || [],
      characterCount: result.post.length,
    };
  } catch (error) {
    console.error(`❌ [AI Tools] Social post generation failed:`, error);
    throw new Error("فشل إنشاء المنشور. يرجى المحاولة مرة أخرى");
  }
}

export async function suggestImageQuery(contentText: string): Promise<{
  queries: string[];
  keywords: string[];
  description: string;
}> {
  console.log(`🖼️ [AI Tools] Suggesting image queries`);

  try {
    const model = genai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `أنت خبير في البحث عن الصور الصحفية. قم بتحليل المحتوى التالي واقترح كلمات بحث للعثور على صور مناسبة:

📄 المحتوى:
${contentText.substring(0, 1000)}

📸 المطلوب:
1. اقترح 3-5 جمل بحث دقيقة باللغة الإنجليزية (للبحث في مكتبات الصور)
2. استخرج 5-7 كلمات مفتاحية ذات صلة
3. وصف بصري للصورة المثالية لهذا المحتوى

قدم الإجابة بصيغة JSON:
{
  "queries": ["image search query 1", "image search query 2", "image search query 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "description": "وصف الصورة المثالية بالعربية"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("فشل في استخراج اقتراحات البحث");
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    console.log(
      `✅ [AI Tools] Generated ${suggestions.queries.length} image search queries`
    );

    return {
      queries: suggestions.queries || [],
      keywords: suggestions.keywords || [],
      description: suggestions.description || "",
    };
  } catch (error) {
    console.error(`❌ [AI Tools] Image query suggestion failed:`, error);
    throw new Error("فشل اقتراح كلمات البحث. يرجى المحاولة مرة أخرى");
  }
}

export async function translateContent(
  text: string,
  fromLang: string,
  toLang: string
): Promise<{
  translatedText: string;
  originalLength: number;
  translatedLength: number;
}> {
  console.log(`🌐 [AI Tools] Translating from ${fromLang} to ${toLang}`);

  try {
    const languageNames: Record<string, string> = {
      ar: "العربية",
      en: "الإنجليزية",
      ur: "الأردية",
      fr: "الفرنسية",
      es: "الإسبانية",
      de: "الألمانية",
      tr: "التركية",
    };

    const fromLangName = languageNames[fromLang] || fromLang;
    const toLangName = languageNames[toLang] || toLang;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `أنت مترجم محترف متخصص في الترجمة الصحفية. قم بترجمة النص التالي من ${fromLangName} إلى ${toLangName}.

📏 معايير الترجمة:
- حافظ على النبرة والأسلوب الأصلي
- ترجم الأسماء والمصطلحات بدقة
- احتفظ بالأرقام والتواريخ كما هي
- استخدم لغة صحفية احترافية
- لا تضف أي معلومات إضافية
- لا تحذف أي معلومات من النص الأصلي

📄 النص الأصلي (${fromLangName}):
${text}

قدم الترجمة فقط إلى ${toLangName} بدون أي مقدمات أو تعليقات.`,
        },
      ],
    });

    const translatedText =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "";

    const originalLength = text.trim().split(/\s+/).length;
    const translatedLength = translatedText.split(/\s+/).length;

    console.log(
      `✅ [AI Tools] Translated ${originalLength} words (${fromLang}) → ${translatedLength} words (${toLang})`
    );

    return {
      translatedText,
      originalLength,
      translatedLength,
    };
  } catch (error) {
    console.error(`❌ [AI Tools] Translation failed:`, error);
    throw new Error("فشلت الترجمة. يرجى المحاولة مرة أخرى");
  }
}
