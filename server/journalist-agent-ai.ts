import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { journalistTasks } from "@shared/schema";
import { eq } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Helper: Update task progress
async function updateTaskProgress(
  taskId: string,
  progressStep: number,
  progress: string,
  results?: any
) {
  await db
    .update(journalistTasks)
    .set({
      progressStep,
      progress,
      results,
      updatedAt: new Date(),
    })
    .where(eq(journalistTasks.id, taskId));
}

// Helper: Mark task as failed
async function markTaskFailed(
  taskId: string,
  errorMessage: string,
  errorStep: string
) {
  await db
    .update(journalistTasks)
    .set({
      status: "failed",
      errorMessage,
      errorStep,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(journalistTasks.id, taskId));
}

// Step 1: Research and gather information
async function performResearch(taskId: string, prompt: string) {
  console.log(`📚 [Journalist Agent] Starting research for task ${taskId}`);
  
  await updateTaskProgress(taskId, 1, "جاري البحث عن المعلومات...");

  try {
    // Use Claude to extract search query from prompt
    const searchQueryResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `من فضلك، استخرج أفضل كلمة بحث من الطلب التالي. اكتب فقط كلمة البحث دون أي شرح أو نص إضافي:\n\n${prompt}`,
        },
      ],
    });

    const searchQuery =
      searchQueryResponse.content[0].type === "text"
        ? searchQueryResponse.content[0].text.trim()
        : prompt;

    console.log(`🔍 [Journalist Agent] Search query: ${searchQuery}`);

    // Simulate web search results (في المستقبل: استخدام web_search API)
    const sources = [
      {
        title: `نتيجة بحث عن: ${searchQuery}`,
        url: "https://example.com/article1",
        snippet: `معلومات حول ${searchQuery}. هذه مسودة تجريبية للنظام.`,
      },
      {
        title: `تقرير متعمق: ${searchQuery}`,
        url: "https://example.com/article2",
        snippet: `تحليل شامل حول ${searchQuery} وأهميته في السوق الحالي.`,
      },
    ];

    // Create summary using AI
    const summaryResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `لخص المعلومات التالية حول "${searchQuery}" بشكل موجز:\n\n${sources
            .map((s) => `- ${s.title}: ${s.snippet}`)
            .join("\n")}`,
        },
      ],
    });

    const summary =
      summaryResponse.content[0].type === "text"
        ? summaryResponse.content[0].text
        : "لم يتم العثور على ملخص";

    return {
      sources,
      summary,
    };
  } catch (error) {
    console.error(`❌ [Journalist Agent] Research failed:`, error);
    throw error;
  }
}

// Step 2: Analyze and extract key points
async function analyzeAndExtractKeyPoints(
  taskId: string,
  prompt: string,
  researchSummary: string
) {
  console.log(`🔬 [Journalist Agent] Analyzing information for task ${taskId}`);
  
  await updateTaskProgress(taskId, 2, "جاري تحليل المعلومات...");

  try {
    const analysisResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `بناءً على الطلب التالي والمعلومات المجمعة، قدم تحليلاً باللغة العربية يتضمن:
1. النقاط الرئيسية (3-5 نقاط)
2. الموضوع الرئيسي
3. الزاوية الصحفية المقترحة

الطلب: ${prompt}

المعلومات المجمعة: ${researchSummary}

قدم الإجابة بصيغة JSON فقط:
{
  "keyPoints": ["نقطة 1", "نقطة 2", "نقطة 3"],
  "mainTheme": "الموضوع الرئيسي",
  "suggestedAngle": "الزاوية المقترحة"
}`,
        },
      ],
    });

    const analysisText =
      analysisResponse.content[0].type === "text"
        ? analysisResponse.content[0].text
        : "{}";

    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("فشل في استخراج التحليل من الاستجابة");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error(`❌ [Journalist Agent] Analysis failed:`, error);
    throw error;
  }
}

// Step 3: Write draft article
async function writeDraft(
  taskId: string,
  prompt: string,
  analysis: any,
  researchSummary: string
) {
  console.log(`✍️ [Journalist Agent] Writing draft for task ${taskId}`);
  
  await updateTaskProgress(taskId, 3, "جاري كتابة المسودة...");

  try {
    const draftResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `اكتب مقالاً إخبارياً باللغة العربية الفصحى بناءً على:

الطلب الأصلي: ${prompt}

النقاط الرئيسية:
${analysis.keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

الموضوع الرئيسي: ${analysis.mainTheme}

الزاوية المقترحة: ${analysis.suggestedAngle}

ملخص البحث: ${researchSummary}

تعليمات الكتابة:
- اكتب مقالاً احترافياً بأسلوب صحفي
- استخدم العربية الفصحى
- اجعل المقال بين 300-500 كلمة
- ابدأ بمقدمة جذابة
- استخدم فقرات واضحة
- اختم بخلاصة قوية

قدم الإجابة بصيغة JSON:
{
  "title": "عنوان المقال",
  "content": "محتوى المقال كاملاً"
}`,
        },
      ],
    });

    const draftText =
      draftResponse.content[0].type === "text"
        ? draftResponse.content[0].text
        : "{}";

    // Extract JSON
    const jsonMatch = draftText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("فشل في استخراج المسودة من الاستجابة");
    }

    const draft = JSON.parse(jsonMatch[0]);
    const wordCount = draft.content.split(/\s+/).length;

    return {
      title: draft.title,
      content: draft.content,
      wordCount,
    };
  } catch (error) {
    console.error(`❌ [Journalist Agent] Draft writing failed:`, error);
    throw error;
  }
}

// Step 4: Find relevant images
async function findRelevantImages(taskId: string, prompt: string, draftTitle: string) {
  console.log(`🖼️ [Journalist Agent] Finding images for task ${taskId}`);
  
  await updateTaskProgress(taskId, 4, "جاري البحث عن الصور المناسبة...");

  try {
    // Simulate image search (في المستقبل: استخدام stock image API)
    const images = [
      {
        url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c",
        description: `صورة متعلقة بـ: ${draftTitle}`,
        source: "Unsplash",
        license: "مجاني للاستخدام",
      },
      {
        url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167",
        description: `صورة توضيحية لـ: ${prompt.substring(0, 50)}...`,
        source: "Unsplash",
        license: "مجاني للاستخدام",
      },
    ];

    return images;
  } catch (error) {
    console.error(`❌ [Journalist Agent] Image search failed:`, error);
    return [];
  }
}

// Step 5: Generate multiple headlines
async function generateHeadlines(
  taskId: string,
  draftTitle: string,
  draftContent: string
) {
  console.log(`📰 [Journalist Agent] Generating headlines for task ${taskId}`);
  
  await updateTaskProgress(taskId, 5, "جاري توليد العناوين البديلة...");

  try {
    const headlines: Array<{ text: string; style: string; aiModel: string }> = [];

    // GPT-5 headline (formal)
    try {
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "أنت خبير في كتابة العناوين الصحفية الاحترافية باللغة العربية.",
          },
          {
            role: "user",
            content: `اقترح عنواناً احترافياً رسمياً للمقال التالي:\n\nالعنوان الحالي: ${draftTitle}\n\nمقتطف من المحتوى: ${draftContent.substring(0, 200)}...\n\nاكتب العنوان فقط دون أي نص إضافي.`,
          },
        ],
        max_tokens: 100,
      });

      headlines.push({
        text: gptResponse.choices[0].message.content?.trim() || draftTitle,
        style: "formal",
        aiModel: "GPT-4o",
      });
    } catch (error) {
      console.error("GPT headline generation failed:", error);
    }

    // Claude headline (engaging)
    try {
      const claudeResponse = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `اقترح عنواناً جذاباً وشيقاً للمقال التالي:\n\nالعنوان الحالي: ${draftTitle}\n\nمقتطف من المحتوى: ${draftContent.substring(0, 200)}...\n\nاكتب العنوان فقط دون أي نص إضافي.`,
          },
        ],
      });

      headlines.push({
        text:
          claudeResponse.content[0].type === "text"
            ? claudeResponse.content[0].text.trim()
            : draftTitle,
        style: "engaging",
        aiModel: "Claude Sonnet 3.5",
      });
    } catch (error) {
      console.error("Claude headline generation failed:", error);
    }

    // Gemini headline (SEO-optimized)
    try {
      const geminiResponse = await genai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `اقترح عنواناً محسّناً لمحركات البحث (SEO) للمقال التالي:\n\nالعنوان الحالي: ${draftTitle}\n\nمقتطف من المحتوى: ${draftContent.substring(0, 200)}...\n\nاكتب العنوان فقط دون أي نص إضافي.`,
              },
            ],
          },
        ],
      });

      headlines.push({
        text: geminiResponse.text?.trim() || draftTitle,
        style: "seo",
        aiModel: "Gemini 2.0 Flash",
      });
    } catch (error) {
      console.error("Gemini headline generation failed:", error);
    }

    // Keep original as casual option
    headlines.push({
      text: draftTitle,
      style: "casual",
      aiModel: "Original",
    });

    return headlines;
  } catch (error) {
    console.error(`❌ [Journalist Agent] Headlines generation failed:`, error);
    return [
      {
        text: draftTitle,
        style: "original",
        aiModel: "Original",
      },
    ];
  }
}

// Main execution function
export async function executeJournalistTask(taskId: string, prompt: string) {
  const startTime = Date.now();
  const aiProviders: string[] = [];

  try {
    console.log(`🚀 [Journalist Agent] Starting task ${taskId}`);

    // Update status to processing
    await db
      .update(journalistTasks)
      .set({
        status: "processing",
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(journalistTasks.id, taskId));

    // Step 1: Research
    const research = await performResearch(taskId, prompt);
    aiProviders.push("Anthropic");

    // Step 2: Analysis
    const analysis = await analyzeAndExtractKeyPoints(taskId, prompt, research.summary);
    aiProviders.push("Anthropic");

    // Step 3: Draft
    const draft = await writeDraft(taskId, prompt, analysis, research.summary);
    aiProviders.push("Anthropic");

    // Step 4: Images
    const images = await findRelevantImages(taskId, prompt, draft.title);

    // Step 5: Headlines
    const headlines = await generateHeadlines(taskId, draft.title, draft.content);
    if (headlines.length > 1) {
      aiProviders.push("OpenAI", "Anthropic", "Google");
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Update task with final results
    await db
      .update(journalistTasks)
      .set({
        status: "completed",
        progressStep: 5,
        progress: "اكتملت المهمة بنجاح!",
        results: {
          research,
          analysis,
          draft,
          images,
          headlines,
        },
        aiProviders: Array.from(new Set(aiProviders)),
        totalTokens: 0, // يمكن حسابه لاحقاً
        processingTime,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(journalistTasks.id, taskId));

    console.log(`✅ [Journalist Agent] Task ${taskId} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ [Journalist Agent] Task ${taskId} failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
    await markTaskFailed(taskId, errorMessage, "execution");
    
    return false;
  }
}
