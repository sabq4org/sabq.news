import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
      throw new Error("AI_INTEGRATIONS_ANTHROPIC_API_KEY is not configured");
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    });
  }
  return anthropicClient;
}

export interface CategoryPrediction {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  confidence: number;
  reasoning: string;
}

export interface ClassificationResult {
  primaryCategory: CategoryPrediction;
  suggestedCategories: CategoryPrediction[];
  provider: string;
  model: string;
}

export async function classifyArticle(
  title: string,
  content: string,
  availableCategories: Array<{ id: string; slug: string; nameAr: string; nameEn: string; nameUr?: string }>
): Promise<ClassificationResult> {
  const categoriesText = availableCategories
    .map((cat) => `- ${cat.slug}: ${cat.nameAr} (${cat.nameEn})`)
    .join("\n");

  const prompt = `أنت نظام تصنيف ذكي متخصص في تصنيف المقالات الإخبارية العربية.

المقال:
العنوان: ${title}
المحتوى: ${content.substring(0, 3000)}

التصنيفات المتاحة:
${categoriesText}

المهمة:
1. حدد التصنيف الأساسي الأنسب للمقال
2. اقترح 1-3 تصنيفات إضافية مناسبة (إن وجدت)
3. قدم نسبة الثقة (0-1) لكل تصنيف
4. اشرح سبب اختيار كل تصنيف بجملة واحدة

الرد بصيغة JSON فقط:
{
  "primaryCategory": {
    "categorySlug": "string",
    "categoryName": "string",
    "confidence": 0.95,
    "reasoning": "string"
  },
  "suggestedCategories": [
    {
      "categorySlug": "string",
      "categoryName": "string", 
      "confidence": 0.85,
      "reasoning": "string"
    }
  ]
}`;

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Iterate over all content blocks to find JSON (more robust than regex)
    let responseText = "";
    for (const block of message.content) {
      if (block.type === "text") {
        responseText += block.text;
      }
    }
    
    if (!responseText) {
      throw new Error("No text content in AI response");
    }

    // Extract JSON - try to find the most complete JSON object
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("AI response without JSON:", responseText);
      throw new Error("Failed to extract JSON from AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const findCategory = (slug: string) => availableCategories.find((c) => c.slug === slug);

    const primaryCat = findCategory(parsed.primaryCategory.categorySlug);
    if (!primaryCat) {
      throw new Error(`Primary category ${parsed.primaryCategory.categorySlug} not found`);
    }

    const suggestedCats = (parsed.suggestedCategories || [])
      .map((sc: any) => {
        const cat = findCategory(sc.categorySlug);
        return cat ? {
          categoryId: cat.id,
          categorySlug: cat.slug,
          categoryName: cat.nameAr,
          confidence: sc.confidence,
          reasoning: sc.reasoning,
        } : null;
      })
      .filter((c: any) => c !== null);

    return {
      primaryCategory: {
        categoryId: primaryCat.id,
        categorySlug: primaryCat.slug,
        categoryName: primaryCat.nameAr,
        confidence: parsed.primaryCategory.confidence,
        reasoning: parsed.primaryCategory.reasoning,
      },
      suggestedCategories: suggestedCats,
      provider: "anthropic",
      model: MODEL,
    };
  } catch (error) {
    console.error("Error classifying article:", error);
    throw new Error("فشل في تصنيف المقال باستخدام الذكاء الاصطناعي");
  }
}
