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
