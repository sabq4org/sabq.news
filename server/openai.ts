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
