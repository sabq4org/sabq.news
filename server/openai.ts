// Reference: javascript_openai blueprint
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper: Strip HTML tags and decode entities
function stripHtml(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

export async function summarizeArticle(text: string): Promise<string> {
  try {
    console.log("[Summarize] 🚀 Starting article summarization...");
    console.log("[Summarize] Input text length:", text.length);
    console.log("[Summarize] Input preview:", text.substring(0, 100) + "...");
    
    // Strip HTML tags for clean processing
    const cleanText = stripHtml(text);
    console.log("[Summarize] Clean text length:", cleanText.length);
    console.log("[Summarize] Clean text preview:", cleanText.substring(0, 100) + "...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "أنت مساعد ذكي متخصص في تلخيص المقالات الإخبارية باللغة العربية. قم بإنشاء ملخص موجز ودقيق يحافظ على النقاط الرئيسية.",
        },
        {
          role: "user",
          content: `قم بتلخيص المقال التالي في 2-3 جمل:\n\n${cleanText}`,
        },
      ],
      max_completion_tokens: 512,
    });

    console.log("[Summarize] ✅ OpenAI response received");
    console.log("[Summarize] Response structure:", JSON.stringify({
      hasChoices: !!response.choices,
      choicesLength: response.choices?.length,
      firstChoice: response.choices?.[0] ? {
        hasMessage: !!response.choices[0].message,
        hasContent: !!response.choices[0].message?.content,
        contentLength: response.choices[0].message?.content?.length,
        finishReason: response.choices[0].finish_reason,
      } : null,
    }));
    
    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      console.warn("[Summarize] ⚠️ Empty response from OpenAI!");
      console.warn("[Summarize] Full response:", JSON.stringify(response, null, 2));
      return "";
    }
    
    console.log("[Summarize] ✅ Summary generated successfully");
    console.log("[Summarize] Summary preview:", content.substring(0, 100));
    console.log("[Summarize] Summary length:", content.length);
    
    return content;
  } catch (error) {
    console.error("[Summarize] ❌ Error summarizing article:", error);
    throw new Error("Failed to summarize article");
  }
}

export async function generateTitle(content: string, language: "ar" | "en" | "ur" = "ar"): Promise<string[]> {
  try {
    console.log("[GenerateTitles] 🚀 Starting title generation...");
    console.log("[GenerateTitles] Language:", language);
    console.log("[GenerateTitles] Content length:", content.length);
    console.log("[GenerateTitles] Content preview:", content.substring(0, 100) + "...");
    
    // Strip HTML tags for clean processing
    const cleanContent = stripHtml(content);
    console.log("[GenerateTitles] Clean content length:", cleanContent.length);
    console.log("[GenerateTitles] Clean content preview:", cleanContent.substring(0, 100) + "...");
    
    const SYSTEM_PROMPTS = {
      ar: "أنت مساعد ذكي متخصص في إنشاء عناوين جذابة للمقالات الإخبارية باللغة العربية. قم بإنشاء عناوين واضحة ومثيرة للاهتمام.",
      en: "You are a smart assistant specialized in creating catchy headlines for news articles in English. Generate clear and interesting headlines.",
      ur: "آپ ایک ذہین معاون ہیں جو اردو میں خبروں کے مضامین کے لیے دلکش عنوانات بنانے میں مہارت رکھتے ہیں۔ واضح اور دلچسپ عنوانات تخلیق کریں۔"
    };

    const USER_PROMPTS = {
      ar: `اقترح 3 عناوين مختلفة للمقال التالي. أعد النتيجة بصيغة JSON كمصفوفة من النصوص:\n\n${cleanContent.substring(0, 1000)}`,
      en: `Suggest 3 different headlines for the following article. Return the result in JSON format as an array of strings:\n\n${cleanContent.substring(0, 1000)}`,
      ur: `مندرجہ ذیل مضمون کے لیے 3 مختلف عنوانات تجویز کریں۔ نتیجہ JSON فارمیٹ میں سٹرنگز کی صف کے طور پر واپس کریں:\n\n${cleanContent.substring(0, 1000)}`
    };

    console.log("[GenerateTitles] Calling OpenAI API...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS[language],
        },
        {
          role: "user",
          content: USER_PROMPTS[language],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 256,
    });

    console.log("[GenerateTitles] ✅ OpenAI response received");
    console.log("[GenerateTitles] Response structure:", JSON.stringify({
      hasChoices: !!response.choices,
      choicesLength: response.choices?.length,
      firstChoice: response.choices?.[0] ? {
        hasMessage: !!response.choices[0].message,
        hasContent: !!response.choices[0].message?.content,
        contentLength: response.choices[0].message?.content?.length,
        finishReason: response.choices[0].finish_reason,
      } : null,
    }));
    
    const messageContent = response.choices?.[0]?.message?.content;
    
    if (!messageContent) {
      console.warn("[GenerateTitles] ⚠️ Empty response from OpenAI!");
      console.warn("[GenerateTitles] Full response:", JSON.stringify(response, null, 2));
      return [];
    }
    
    console.log("[GenerateTitles] Raw message content:", messageContent);
    
    const result = JSON.parse(messageContent);
    console.log("[GenerateTitles] Parsed JSON result:", JSON.stringify(result, null, 2));
    
    const titles = result.titles || [];
    console.log("[GenerateTitles] ✅ Titles extracted:", titles.length, "titles");
    console.log("[GenerateTitles] Titles:", titles);
    
    return titles;
  } catch (error) {
    console.error("[GenerateTitles] ❌ Error generating titles:", error);
    throw new Error("Failed to generate titles");
  }
}

export async function getArticleRecommendations(
  userHistory: { categoryId?: string; title: string }[],
  availableArticles: { id: string; title: string; categoryId?: string }[]
): Promise<string[]> {
  try {
    const historyText = userHistory
      .map(h => `- ${h.title} (${h.categoryId})`)
      .join("\n");
    
    const articlesText = availableArticles
      .map(a => `ID: ${a.id}, العنوان: ${a.title}, التصنيف: ${a.categoryId}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "أنت نظام توصيات ذكي. بناءً على سجل قراءة المستخدم، اختر أفضل المقالات التي قد تهمه. أعد قائمة بمعرفات المقالات (IDs) بصيغة JSON.",
        },
        {
          role: "user",
          content: `سجل قراءة المستخدم:\n${historyText}\n\nالمقالات المتاحة:\n${articlesText}\n\nاختر أفضل 5 مقالات. أعد النتيجة بصيغة JSON: {"recommendations": ["id1", "id2", ...]}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 256,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.recommendations || [];
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
}

export async function chatWithAssistant(
  message: string,
  recentArticles: { title: string; summary?: string; categoryNameAr?: string }[]
): Promise<string> {
  try {
    console.log("[ChatAssistant] Processing message:", message.substring(0, 100));
    
    const articlesContext = recentArticles
      .map((article, index) => 
        `${index + 1}. ${article.title}${article.categoryNameAr ? ` (${article.categoryNameAr})` : ''}${article.summary ? `\n   ملخص: ${article.summary}` : ''}`
      )
      .join('\n');

    const systemPrompt = `أنت مساعد أخبار ذكي لصحيفة سبق. ساعد القراء في العثور على الأخبار والمعلومات. أجب بالعربية دائماً.

آخر الأخبار المنشورة:
${articlesContext}

استخدم هذه الأخبار للإجابة على أسئلة القارئ عندما يكون ذلك مناسباً.`;

    console.log("[ChatAssistant] Calling OpenAI API...");
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_completion_tokens: 512,
    });

    console.log("[ChatAssistant] OpenAI response received successfully");
    console.log("[ChatAssistant] Response structure:", JSON.stringify({
      hasChoices: !!response.choices,
      choicesLength: response.choices?.length,
      firstChoice: response.choices?.[0] ? {
        hasMessage: !!response.choices[0].message,
        hasContent: !!response.choices[0].message?.content,
        contentLength: response.choices[0].message?.content?.length,
        finishReason: response.choices[0].finish_reason,
      } : null,
    }));
    
    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      console.warn("[ChatAssistant] Empty response from OpenAI");
      console.warn("[ChatAssistant] Full response:", JSON.stringify(response, null, 2));
      return "عذراً، لم أتمكن من معالجة طلبك.";
    }
    
    console.log("[ChatAssistant] Response content:", content.substring(0, 100));
    return content;
  } catch (error: any) {
    console.error("[ChatAssistant] Error:", error);
    console.error("[ChatAssistant] Error details:", {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
    });
    
    // Return user-friendly error message instead of throwing
    if (error.status === 401) {
      return "عذراً، هناك مشكلة في إعدادات المساعد الذكي. يرجى المحاولة لاحقاً.";
    } else if (error.status === 429) {
      return "عذراً، تم تجاوز حد الاستخدام. يرجى المحاولة بعد قليل.";
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return "عذراً، لا يمكن الاتصال بالمساعد الذكي حالياً. يرجى المحاولة لاحقاً.";
    }
    
    return "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.";
  }
}

export async function analyzeCredibility(
  articleContent: string,
  title: string
): Promise<{
  score: number;
  factors: { name: string; score: number; note: string }[];
  summary: string;
}> {
  try {
    const systemPrompt = `أنت خبير في تحليل مصداقية المحتوى الصحفي. قم بتحليل المقال بناءً على المعايير الصحفية التالية:

1. **المصادر**: وجود مصادر موثوقة ومتنوعة
2. **الوضوح**: وضوح المعلومات والحقائق المقدمة
3. **التوازن**: التوازن في عرض وجهات النظر المختلفة
4. **الدقة اللغوية**: الدقة اللغوية والنحوية والإملائية

أعد النتيجة بصيغة JSON فقط مع الحقول التالية:
- score: رقم من 0 إلى 100 (إجمالي المصداقية)
- factors: مصفوفة من الكائنات، كل كائن يحتوي على:
  - name: اسم المعيار (المصادر، الوضوح، التوازن، الدقة اللغوية)
  - score: درجة من 0 إلى 100
  - note: ملاحظة قصيرة (جملة واحدة)
- summary: ملخص شامل للتحليل (2-3 جمل)`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `العنوان: ${title}\n\nالمحتوى:\n${articleContent.substring(0, 3000)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      score: result.score || 0,
      factors: result.factors || [],
      summary: result.summary || "لم يتم التحليل",
    };
  } catch (error) {
    console.error("Error analyzing credibility:", error);
    throw new Error("Failed to analyze article credibility");
  }
}

export async function generateDailyActivityInsights(
  activities: Array<{
    type: string;
    summary: string;
    occurredAt: string;
    importance: string;
    target?: { title?: string; kind?: string };
  }>,
  stats: {
    activeUsers: number;
    totalComments: number;
    totalReactions: number;
    publishedArticles: number;
    breakingNews: number;
  },
  previousStats?: {
    activeUsers: number;
    totalComments: number;
    totalReactions: number;
  }
): Promise<{
  dailySummary: string;
  topTopics: Array<{ name: string; score: number }>;
  activityTrend: string;
  keyHighlights: string[];
}> {
  try {
    const activitiesText = activities
      .slice(0, 50)
      .map((a, i) => `${i + 1}. [${a.type}] ${a.summary} (${a.importance})`)
      .join("\n");

    const trendInfo = previousStats
      ? `
مقارنة مع الفترة السابقة:
- المستخدمون النشطون: ${stats.activeUsers} (كانوا ${previousStats.activeUsers})
- التعليقات: ${stats.totalComments} (كانت ${previousStats.totalComments})
- التفاعلات: ${stats.totalReactions} (كانت ${previousStats.totalReactions})
`
      : '';

    const systemPrompt = `أنت محلل ذكي للأنشطة اليومية في منصة إخبارية. مهمتك تحليل نشاط اليوم وتقديم رؤى ذكية بالعربية.

قم بتحليل الأنشطة المذكورة أدناه وأعد نتيجة JSON فقط تحتوي على:

1. **dailySummary**: ملخص ذكي وجذاب للنشاط اليومي (2-3 جمل)
2. **topTopics**: قائمة بأكثر 5 مواضيع نشاطاً اليوم. كل موضوع يحتوي على:
   - name: اسم الموضوع
   - score: نقاط النشاط (عدد)
3. **activityTrend**: نص يصف اتجاه النشاط (جملة واحدة مثل "نشاط متزايد بنسبة 15%")
4. **keyHighlights**: قائمة بأهم 3 أحداث اليوم (نصوص قصيرة)

كن إيجابياً ومحفزاً في الوصف. استخدم الأرقام عند الحاجة.`;

    const userPrompt = `
الإحصائيات اليومية:
- عدد المستخدمين النشطين: ${stats.activeUsers}
- عدد التعليقات: ${stats.totalComments}
- عدد التفاعلات: ${stats.totalReactions}
- المقالات المنشورة: ${stats.publishedArticles}
- الأخبار العاجلة: ${stats.breakingNews}
${trendInfo}

آخر الأنشطة:
${activitiesText}

قم بتحليل هذه البيانات وإنشاء رؤى ذكية بصيغة JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      dailySummary: result.dailySummary || "لا توجد أنشطة كافية لتحليل اليوم.",
      topTopics: result.topTopics || [],
      activityTrend: result.activityTrend || "نشاط مستقر",
      keyHighlights: result.keyHighlights || [],
    };
  } catch (error) {
    console.error("Error generating daily insights:", error);
    return {
      dailySummary: "نشاط معتدل اليوم مع تفاعل جيد من المستخدمين.",
      topTopics: [],
      activityTrend: "نشاط مستقر",
      keyHighlights: [],
    };
  }
}

export async function analyzeSEO(
  title: string,
  content: string,
  excerpt?: string
): Promise<{
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  socialTitle: string;
  socialDescription: string;
  imageAltText: string;
  suggestions: string[];
  score: number;
}> {
  try {
    const systemPrompt = `أنت خبير في تحسين محركات البحث (SEO) للمحتوى العربي. مهمتك تحليل المقالات الإخبارية وتقديم توصيات SEO محسّنة.

قم بتحليل المقال وإنشاء:
1. **seoTitle**: عنوان محسّن لمحركات البحث (50-60 حرف) - جذاب ويحتوي على كلمات مفتاحية
2. **metaDescription**: وصف meta (150-160 حرف) - ملخص جذاب يشجع على النقر
3. **keywords**: 5-7 كلمات مفتاحية رئيسية (مصفوفة نصوص)
4. **socialTitle**: عنوان للمشاركة الاجتماعية (أقصر وأكثر جاذبية - 70 حرف)
5. **socialDescription**: وصف للمشاركة الاجتماعية (100-120 حرف)
6. **imageAltText**: نص بديل للصورة البارزة (80-100 حرف) - وصف دقيق للمحتوى
7. **suggestions**: 3-5 اقتراحات لتحسين SEO (مصفوفة نصوص قصيرة)
8. **score**: تقييم SEO الحالي من 0-100

معايير التقييم:
- العنوان يحتوي على كلمات مفتاحية (20 نقطة)
- طول المحتوى مناسب (20 نقطة)
- استخدام العناوين الفرعية (20 نقطة)
- وضوح المعلومات (20 نقطة)
- جودة اللغة (20 نقطة)

أعد النتيجة بصيغة JSON فقط.`;

    const userContent = `العنوان: ${title}

${excerpt ? `المقدمة: ${excerpt}\n\n` : ''}المحتوى (أول 2000 حرف):
${content.substring(0, 2000)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1536,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      seoTitle: result.seoTitle || title,
      metaDescription: result.metaDescription || excerpt || "",
      keywords: result.keywords || [],
      socialTitle: result.socialTitle || title,
      socialDescription: result.socialDescription || excerpt || "",
      imageAltText: result.imageAltText || title,
      suggestions: result.suggestions || [],
      score: result.score || 0,
    };
  } catch (error) {
    console.error("Error analyzing SEO:", error);
    throw new Error("Failed to analyze SEO");
  }
}

export async function generateSmartContent(newsContent: string): Promise<{
  mainTitle: string;
  subTitle: string;
  smartSummary: string;
  keywords: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
  };
}> {
  try {
    const systemPrompt = `🎯 الدور: أنت محرر خبير في صحيفة "سبق" السعودية، متخصص في كتابة الأخبار بأسلوب صحفي احترافي وسهل الفهم، يدعم تحسين محركات البحث (SEO) ويجذب القارئ العربي.

✳️ المطلوب منك:
1. **العنوان الرئيسي:**  
   - لا يتجاوز 10 كلمات.  
   - جذّاب، قوي، ومناسب لأسلوب صحيفة "سبق".  
   - يتضمن كلمة مفتاحية رئيسية.  

2. **العنوان الفرعي:**  
   - جملة توضيحية قصيرة (15–25 كلمة).  
   - تكمّل العنوان الرئيسي وتمنح القارئ فكرة واضحة عن مضمون الخبر.  

3. **الموجز الذكي (Summary):**  
   - فقرة واحدة (40–60 كلمة).  
   - تشرح الفكرة الأساسية بلغة عربية فصيحة وسلسة.  
   - يجب أن تحتوي على حقائق واضحة بدون مبالغة.  

4. **الكلمات المفتاحية (Keywords):**  
   - قائمة من 6–10 كلمات أو عبارات.  
   - متعلقة مباشرة بالخبر ومهيأة لتحسين الظهور في نتائج البحث.  

5. **تحسين SEO:**  
   - توليد "Meta Title" و"Meta Description" احترافيين.  
   - تضمين الكلمات المفتاحية في النصين بطريقة طبيعية.  
   - ضمان ألا يتجاوز الوصف 160 حرفاً.  

🪄 التوجيهات التحريرية:
- استخدم لغة عربية فصحى مبسطة وواضحة.  
- حافظ على الأسلوب الإخباري الرسمي لصحيفة "سبق".  
- تجنب أي تحيز أو رأي شخصي.  
- استخدم جُملاً قصيرة ومباشرة.  
- في حالة الأخبار العاجلة، اجعل العنوان يحتوي على عنصر السرعة أو المفاجأة.

أعد النتيجة بصيغة JSON فقط مع الحقول التالية:
{
  "main_title": "",
  "sub_title": "",
  "smart_summary": "",
  "keywords": [],
  "seo": {
    "meta_title": "",
    "meta_description": ""
  }
}`;

    const userPrompt = `📦 المدخلات:
النص الخام أو تفاصيل الخبر:

${newsContent}

قم بتوليد جميع العناصر التحريرية المطلوبة بصيغة JSON.`;

    console.log("[Smart Content] Generating smart content with GPT-5...");
    console.log("[Smart Content] Input content length:", newsContent.length);
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048, // Increased from 1024 to allow full response
    });

    console.log("[Smart Content] ✅ OpenAI response received");
    console.log("[Smart Content] Finish reason:", response.choices[0].finish_reason);
    console.log("[Smart Content] Message content length:", response.choices[0].message.content?.length || 0);
    console.log("[Smart Content] Full message content:", response.choices[0].message.content);
    
    // Check if response was cut off
    if (response.choices[0].finish_reason === "length") {
      console.error("[Smart Content] ⚠️ Response was truncated due to token limit!");
      throw new Error("Response truncated - increase max_completion_tokens");
    }
    
    const messageContent = response.choices[0].message.content;
    if (!messageContent || messageContent.trim() === "") {
      console.error("[Smart Content] ❌ Empty response from OpenAI");
      throw new Error("Empty response from OpenAI");
    }
    
    const result = JSON.parse(messageContent);
    
    console.log("[Smart Content] Parsed result:", {
      hasMainTitle: !!result.main_title,
      hasSubTitle: !!result.sub_title,
      hasSummary: !!result.smart_summary,
      keywordsCount: result.keywords?.length || 0,
      hasSeo: !!result.seo
    });
    console.log("[Smart Content] ✅ Successfully generated content");
    
    return {
      mainTitle: result.main_title || "",
      subTitle: result.sub_title || "",
      smartSummary: result.smart_summary || "",
      keywords: result.keywords || [],
      seo: {
        metaTitle: result.seo?.meta_title || "",
        metaDescription: result.seo?.meta_description || "",
      },
    };
  } catch (error) {
    console.error("[Smart Content] Error generating smart content:", error);
    throw new Error("Failed to generate smart content");
  }
}

export async function extractMediaKeywords(
  title: string,
  content?: string
): Promise<string[]> {
  try {
    const systemPrompt = `أنت خبير في تحليل المحتوى الإخباري العربي وتحديد الكلمات المفتاحية للبحث عن الصور والوسائط المناسبة.

مهمتك: تحليل المقال واستخراج الكلمات المفتاحية التي يمكن استخدامها للبحث عن صور ذات صلة في مكتبة الوسائط.

معايير استخراج الكلمات المفتاحية:
1. الأسماء والكيانات الرئيسية (أشخاص، أماكن، منظمات)
2. المواضيع والمفاهيم الرئيسية
3. الأحداث والمناسبات
4. المجالات والقطاعات (رياضة، سياسة، اقتصاد، إلخ)
5. الصفات والخصائص المميزة

توجيهات:
- استخرج 5-10 كلمات مفتاحية
- استخدم كلمات واضحة ومحددة
- تجنب الكلمات العامة جداً (مثل "خبر" أو "تقرير")
- ركز على الكلمات التي تصف محتوى بصري محتمل
- استخدم اللغة العربية فقط

أعد النتيجة بصيغة JSON فقط:
{
  "keywords": ["كلمة1", "كلمة2", ...]
}`;

    const userContent = content 
      ? `العنوان: ${title}\n\nالمحتوى (أول 1000 حرف):\n${content.substring(0, 1000)}`
      : `العنوان: ${title}`;

    console.log("[Extract Keywords] Analyzing content for media keywords...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 512,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const keywords = result.keywords || [];
    
    console.log("[Extract Keywords] ✅ Extracted keywords:", keywords);
    return keywords;
  } catch (error) {
    console.error("[Extract Keywords] Error extracting keywords:", error);
    // Fallback: extract simple keywords from title
    const fallbackKeywords = title
      .split(/[\s،؛]+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
    console.log("[Extract Keywords] Using fallback keywords:", fallbackKeywords);
    return fallbackKeywords;
  }
}
