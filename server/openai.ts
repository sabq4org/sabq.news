// Reference: javascript_openai blueprint
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function summarizeArticle(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "أنت مساعد ذكي متخصص في تلخيص المقالات الإخبارية باللغة العربية. قم بإنشاء ملخص موجز ودقيق يحافظ على النقاط الرئيسية.",
        },
        {
          role: "user",
          content: `قم بتلخيص المقال التالي في 2-3 جمل:\n\n${text}`,
        },
      ],
      max_completion_tokens: 512,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error summarizing article:", error);
    throw new Error("Failed to summarize article");
  }
}

export async function generateTitle(content: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "أنت مساعد ذكي متخصص في إنشاء عناوين جذابة للمقالات الإخبارية باللغة العربية. قم بإنشاء عناوين واضحة ومثيرة للاهتمام.",
        },
        {
          role: "user",
          content: `اقترح 3 عناوين مختلفة للمقال التالي. أعد النتيجة بصيغة JSON كمصفوفة من النصوص:\n\n${content.substring(0, 1000)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 256,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.titles || [];
  } catch (error) {
    console.error("Error generating titles:", error);
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

export async function analyzeDailyPulse(
  articles: Array<{
    id: string;
    title: string;
    views: number;
    reactions: number;
    comments: number;
    shares: number;
    momentum: number;
    categoryNameAr: string;
    publishedAt: Date;
  }>,
  language: 'ar' | 'en'
): Promise<{
  trendingArticles: Array<{
    articleId: string;
    rank: number;
    score: number;
    momentum: number;
    trendReason: string;
  }>;
  pulseStatus: string;
  topCategory: string;
  demographicDiversity: number;
}> {
  try {
    console.log("[Daily Pulse] Analyzing trending articles...");
    console.log("[Daily Pulse] Total articles:", articles.length);
    console.log("[Daily Pulse] Language:", language);

    const articlesText = articles
      .slice(0, 50)
      .map((a, i) => {
        const timeAgo = Math.floor((Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60));
        return `${i + 1}. ID: ${a.id}
   العنوان: ${a.title}
   التصنيف: ${a.categoryNameAr}
   المشاهدات: ${a.views}
   التفاعلات: ${a.reactions}
   التعليقات: ${a.comments}
   المشاركات: ${a.shares}
   الزخم: ${a.momentum}
   منذ: ${timeAgo} دقيقة`;
      })
      .join("\n\n");

    const systemPrompt = language === 'ar' 
      ? `أنت محلل ترندات ذكي متخصص في تحليل النبض اليومي للأخبار. مهمتك تحديد المقالات الأكثر رواجاً وشعبية بناءً على البيانات الفعلية.

معايير التحليل:
1. **الزخم (Momentum)**: مدى سرعة انتشار المقال
2. **المشاهدات (Views)**: عدد القراء
3. **التفاعلات (Reactions)**: إعجابات وتفاعلات
4. **التعليقات (Comments)**: مدى النقاش حول المقال
5. **المشاركات (Shares)**: انتشار المقال
6. **الحداثة**: المقالات الأحدث لها أولوية

قم بتحليل المقالات المذكورة وأعد نتيجة JSON فقط تحتوي على:

1. **trendingArticles**: قائمة بأفضل 10 مقالات ترند. كل مقال يحتوي على:
   - articleId: معرف المقال
   - rank: الترتيب (1-10)
   - score: نقاط الترند (0-100)
   - momentum: قيمة الزخم
   - trendReason: سبب الترند (جملة واحدة جذابة، مثل "انتشار واسع مع تفاعل قوي" أو "موضوع حديث الساعة")

2. **pulseStatus**: حالة النبض اليومي - اختر من:
   - "نشاط قوي" (إذا كان هناك تفاعل كبير)
   - "نشاط معتدل" (نشاط عادي)
   - "نشاط هادئ" (نشاط منخفض)

3. **topCategory**: التصنيف الأكثر نشاطاً (اسم التصنيف)

4. **demographicDiversity**: تنوع التصنيفات (رقم من 0-100، حيث 100 يعني تنوع كامل في المواضيع)`
      : `You are a smart trend analyzer specialized in analyzing the daily pulse of news. Your task is to identify the most trending and popular articles based on real-time data.

Analysis Criteria:
1. **Momentum**: How fast the article is spreading
2. **Views**: Number of readers
3. **Reactions**: Likes and interactions
4. **Comments**: Discussion level
5. **Shares**: Article spread
6. **Recency**: Newer articles have priority

Analyze the mentioned articles and return a JSON result containing:

1. **trendingArticles**: List of top 10 trending articles. Each article contains:
   - articleId: Article ID
   - rank: Ranking (1-10)
   - score: Trend score (0-100)
   - momentum: Momentum value
   - trendReason: Trend reason (one attractive sentence, like "Massive spread with strong engagement" or "Hot topic of the hour")

2. **pulseStatus**: Daily pulse status - choose from:
   - "High Activity" (if there's high engagement)
   - "Moderate Activity" (normal activity)
   - "Low Activity" (low activity)

3. **topCategory**: Most active category (category name)

4. **demographicDiversity**: Category diversity (number 0-100, where 100 means complete topic diversity)`;

    const userPrompt = language === 'ar'
      ? `المقالات المتاحة للتحليل:\n\n${articlesText}\n\nقم بتحليل هذه المقالات وحدد أفضل 10 مقالات ترند مع أسباب واضحة. أعد النتيجة بصيغة JSON.`
      : `Available articles for analysis:\n\n${articlesText}\n\nAnalyze these articles and identify the top 10 trending articles with clear reasons. Return the result in JSON format.`;

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
      max_completion_tokens: 2048,
    });

    console.log("[Daily Pulse] ✅ OpenAI response received");
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    console.log("[Daily Pulse] Analysis complete:", {
      trendingCount: result.trendingArticles?.length || 0,
      pulseStatus: result.pulseStatus,
      topCategory: result.topCategory,
    });

    return {
      trendingArticles: result.trendingArticles || [],
      pulseStatus: result.pulseStatus || (language === 'ar' ? "نشاط معتدل" : "Moderate Activity"),
      topCategory: result.topCategory || (language === 'ar' ? "عام" : "General"),
      demographicDiversity: result.demographicDiversity || 50,
    };
  } catch (error) {
    console.error("[Daily Pulse] Error analyzing daily pulse:", error);
    return {
      trendingArticles: [],
      pulseStatus: language === 'ar' ? "نشاط معتدل" : "Moderate Activity",
      topCategory: language === 'ar' ? "عام" : "General",
      demographicDiversity: 50,
    };
  }
}

export async function analyzePersonalizedTrend(
  userId: string,
  userHistory: Array<{
    articleTitle: string;
    categoryNameAr: string;
    readAt: Date;
  }>,
  availableArticles: Array<{
    id: string;
    title: string;
    categoryNameAr: string;
    views: number;
    momentum: number;
  }>,
  language: 'ar' | 'en'
): Promise<{
  personalizedArticles: Array<{
    articleId: string;
    rank: number;
    score: number;
    matchReason: string;
  }>;
  userProfile: string;
}> {
  try {
    console.log("[Personalized Trend] Analyzing user preferences...");
    console.log("[Personalized Trend] User ID:", userId);
    console.log("[Personalized Trend] History items:", userHistory.length);
    console.log("[Personalized Trend] Available articles:", availableArticles.length);
    console.log("[Personalized Trend] Language:", language);

    const historyText = userHistory
      .slice(0, 30)
      .map((h, i) => {
        const timeAgo = Math.floor((Date.now() - new Date(h.readAt).getTime()) / (1000 * 60 * 60));
        return `${i + 1}. "${h.articleTitle}" - ${h.categoryNameAr} (منذ ${timeAgo} ساعة)`;
      })
      .join("\n");

    const articlesText = availableArticles
      .slice(0, 50)
      .map((a, i) => `${i + 1}. ID: ${a.id}
   العنوان: ${a.title}
   التصنيف: ${a.categoryNameAr}
   المشاهدات: ${a.views}
   الزخم: ${a.momentum}`)
      .join("\n\n");

    const systemPrompt = language === 'ar'
      ? `أنت محلل ذكاء اصطناعي متخصص في التوصيات الشخصية. مهمتك تحليل سلوك القارئ وتقديم توصيات مخصصة تناسب اهتماماته.

معايير التحليل:
1. **الاهتمامات**: التصنيفات التي يتابعها المستخدم
2. **التكرار**: المواضيع التي يقرأها بشكل متكرر
3. **الحداثة**: اهتماماته الأخيرة لها أولوية
4. **التنوع**: تقديم بعض التنوع في التوصيات
5. **الجودة**: المقالات ذات الزخم العالي

قم بتحليل سجل القراءة والمقالات المتاحة وأعد نتيجة JSON فقط تحتوي على:

1. **personalizedArticles**: قائمة بأفضل 10 مقالات مخصصة. كل مقال يحتوي على:
   - articleId: معرف المقال
   - rank: الترتيب (1-10)
   - score: درجة التطابق (0-100)
   - matchReason: سبب التوصية (جملة واحدة، مثل "يناسب اهتمامك بالرياضة" أو "موضوع متعلق بقراءاتك السابقة")

2. **userProfile**: وصف ملف المستخدم (2-3 كلمات، مثل "قارئ رياضي" أو "متابع سياسي" أو "مهتم بالتقنية" أو "قارئ متنوع")`
      : `You are an AI analyst specialized in personalized recommendations. Your task is to analyze reader behavior and provide customized recommendations matching their interests.

Analysis Criteria:
1. **Interests**: Categories the user follows
2. **Frequency**: Topics they read repeatedly
3. **Recency**: Recent interests have priority
4. **Diversity**: Provide some variety in recommendations
5. **Quality**: Articles with high momentum

Analyze the reading history and available articles and return a JSON result containing:

1. **personalizedArticles**: List of top 10 personalized articles. Each article contains:
   - articleId: Article ID
   - rank: Ranking (1-10)
   - score: Match score (0-100)
   - matchReason: Recommendation reason (one sentence, like "Matches your sports interest" or "Related to your previous reads")

2. **userProfile**: User profile description (2-3 words, like "Sports Reader" or "Politics Follower" or "Tech Enthusiast" or "Diverse Reader")`;

    const userPrompt = language === 'ar'
      ? `سجل قراءة المستخدم:\n${historyText}\n\nالمقالات المتاحة:\n\n${articlesText}\n\nقم بتحليل الاهتمامات واختيار أفضل 10 مقالات مخصصة. أعد النتيجة بصيغة JSON.`
      : `User reading history:\n${historyText}\n\nAvailable articles:\n\n${articlesText}\n\nAnalyze interests and select the top 10 personalized articles. Return the result in JSON format.`;

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
      max_completion_tokens: 2048,
    });

    console.log("[Personalized Trend] ✅ OpenAI response received");
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    console.log("[Personalized Trend] Analysis complete:", {
      recommendedCount: result.personalizedArticles?.length || 0,
      userProfile: result.userProfile,
    });

    return {
      personalizedArticles: result.personalizedArticles || [],
      userProfile: result.userProfile || (language === 'ar' ? "قارئ عام" : "General Reader"),
    };
  } catch (error) {
    console.error("[Personalized Trend] Error analyzing personalized trend:", error);
    return {
      personalizedArticles: [],
      userProfile: language === 'ar' ? "قارئ عام" : "General Reader",
    };
  }
}

export async function analyzePredictiveTrend(
  articles: Array<{
    id: string;
    title: string;
    content: string;
    categoryNameAr: string;
    momentum: number;
    views: number;
    publishedAt: Date;
  }>,
  language: 'ar' | 'en'
): Promise<{
  predictedArticles: Array<{
    articleId: string;
    rank: number;
    predictedTrendTime: string;
    confidenceScore: number;
    predictionReason: string;
  }>;
  trendForecast: string;
}> {
  try {
    console.log("[Predictive Trend] Predicting future trends...");
    console.log("[Predictive Trend] Total articles:", articles.length);
    console.log("[Predictive Trend] Language:", language);

    const articlesText = articles
      .slice(0, 30)
      .map((a, i) => {
        const timeAgo = Math.floor((Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60));
        const contentPreview = a.content.substring(0, 300);
        return `${i + 1}. ID: ${a.id}
   العنوان: ${a.title}
   التصنيف: ${a.categoryNameAr}
   المشاهدات: ${a.views}
   الزخم: ${a.momentum}
   منذ: ${timeAgo} دقيقة
   المحتوى: ${contentPreview}...`;
      })
      .join("\n\n");

    const systemPrompt = language === 'ar'
      ? `أنت محلل ذكاء اصطناعي متخصص في التنبؤ بالترندات القادمة. مهمتك تحليل المقالات الحالية والتنبؤ بما سيصبح ترند في الساعات القادمة.

معايير التنبؤ:
1. **الزخم المتزايد**: مقالات تكتسب زخماً سريعاً
2. **الموضوع الساخن**: مواضيع حديثة ومثيرة
3. **الوقت والتوقيت**: الأحداث المرتبطة بوقت معين
4. **التفاعل المبكر**: مقالات بدأت تحصل على تفاعل
5. **الأهمية**: مواضيع ذات أهمية عامة

قم بتحليل المقالات والتنبؤ بأفضل 5-7 مقالات ستصبح ترند خلال الـ 6 ساعات القادمة. أعد نتيجة JSON فقط تحتوي على:

1. **predictedArticles**: قائمة المقالات المتوقع أن تترند. كل مقال يحتوي على:
   - articleId: معرف المقال
   - rank: الترتيب (1-7)
   - predictedTrendTime: توقيت الترند (اختر من: "في الساعات القادمة" أو "خلال 3 ساعات" أو "غداً" أو "قريباً")
   - confidenceScore: نسبة الثقة (0-100)
   - predictionReason: سبب التنبؤ (جملة واحدة، مثل "زخم متزايد وموضوع ساخن" أو "حدث مرتقب وتفاعل مبكر قوي")

2. **trendForecast**: ملخص التوقعات العامة (2-3 جمل، مثل "نتوقع نشاطاً قوياً في قطاع الرياضة. المواضيع السياسية ستستمر في جذب الاهتمام.")`
      : `You are an AI analyst specialized in predicting upcoming trends. Your task is to analyze current articles and predict what will trend in the coming hours.

Prediction Criteria:
1. **Increasing Momentum**: Articles gaining rapid momentum
2. **Hot Topic**: Recent and exciting topics
3. **Timing**: Events linked to specific times
4. **Early Engagement**: Articles starting to get interaction
5. **Importance**: Topics of general importance

Analyze the articles and predict the top 5-7 articles that will trend in the next 6 hours. Return a JSON result containing:

1. **predictedArticles**: List of articles predicted to trend. Each article contains:
   - articleId: Article ID
   - rank: Ranking (1-7)
   - predictedTrendTime: Trend timing (choose from: "In the coming hours" or "Within 3 hours" or "Tomorrow" or "Soon")
   - confidenceScore: Confidence percentage (0-100)
   - predictionReason: Prediction reason (one sentence, like "Increasing momentum and hot topic" or "Anticipated event with strong early engagement")

2. **trendForecast**: General forecast summary (2-3 sentences, like "We expect strong activity in the sports sector. Political topics will continue to attract attention.")`;

    const userPrompt = language === 'ar'
      ? `المقالات المتاحة للتحليل:\n\n${articlesText}\n\nقم بتحليل هذه المقالات والتنبؤ بما سيصبح ترند في الساعات القادمة. أعد النتيجة بصيغة JSON.`
      : `Available articles for analysis:\n\n${articlesText}\n\nAnalyze these articles and predict what will trend in the coming hours. Return the result in JSON format.`;

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
      max_completion_tokens: 2048,
    });

    console.log("[Predictive Trend] ✅ OpenAI response received");
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    console.log("[Predictive Trend] Prediction complete:", {
      predictedCount: result.predictedArticles?.length || 0,
      forecast: result.trendForecast?.substring(0, 100),
    });

    return {
      predictedArticles: result.predictedArticles || [],
      trendForecast: result.trendForecast || (language === 'ar' 
        ? "نتوقع نشاطاً معتدلاً في الساعات القادمة."
        : "We expect moderate activity in the coming hours."),
    };
  } catch (error) {
    console.error("[Predictive Trend] Error analyzing predictive trend:", error);
    return {
      predictedArticles: [],
      trendForecast: language === 'ar'
        ? "نتوقع نشاطاً معتدلاً في الساعات القادمة."
        : "We expect moderate activity in the coming hours.",
    };
  }
}
