import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { journalistTasks } from "@shared/schema";
import { eq } from "drizzle-orm";

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
      model: "claude-sonnet-4-5",
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
      model: "claude-sonnet-4-5",
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
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `أنت محلل صحفي في "سبق". قم بتحليل المعلومات التالية واستخراج عناصر القصة الصحفية:

📍 الطلب الأصلي: ${prompt}

📊 المعلومات المجمعة: ${researchSummary}

📰 قدم تحليلاً صحفياً شاملاً يتضمن:

1. **النقاط الرئيسية** (3-5 نقاط):
   - كل نقطة يجب أن تكون واضحة ومحددة
   - تركز على المعلومات الصلبة (أرقام، تواريخ، أشخاص، أماكن)
   - قابلة للتحقق والنشر

2. **الموضوع الرئيسي**:
   - ما هي القصة الأساسية؟
   - لماذا تهم القارئ السعودي؟

3. **الزاوية الصحفية** (نمط سبق):
   اختر من بين:
   - "خبر عاجل" (breaking news)
   - "متابعة ميدانية" (field follow-up)
   - "تحليل بيانات" (data analysis)
   - "تأثير مباشر" (direct impact on citizens)
   - "تصريحات رسمية" (official statements)

4. **العنصر البشري** (إن وجد):
   - من المتأثرون؟
   - ما هي ردود الفعل المتوقعة؟

5. **السياق المحلي**:
   - كيف يرتبط هذا بالسعودية/المنطقة؟
   - ما هي الخلفية اللازمة؟

قدم الإجابة بصيغة JSON فقط:
{
  "keyPoints": [
    "نقطة رئيسية محددة بأرقام أو تفاصيل",
    "نقطة ثانية واضحة",
    "نقطة ثالثة"
  ],
  "mainTheme": "الموضوع الرئيسي للقصة",
  "suggestedAngle": "الزاوية الصحفية المقترحة",
  "humanElement": "العنصر البشري أو المتأثرون",
  "localContext": "السياق المحلي السعودي/الإقليمي"
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
      model: "claude-sonnet-4-5",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: `أنت محرر صحفي محترف في صحيفة "سبق" الإلكترونية السعودية. اكتب خبراً صحفياً احترافياً بأسلوب "سبق" عن:

📍 الموضوع: ${prompt}

📊 المعلومات الأساسية:
النقاط الرئيسية:
${analysis.keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

الموضوع الرئيسي: ${analysis.mainTheme}
الزاوية الصحفية: ${analysis.suggestedAngle}

ملخص البحث:
${researchSummary}

📜 معايير الكتابة بأسلوب "سبق" الصحفية (التزم بها بدقة 100%):

**1. العنوان (Title):**
✅ لا يتجاوز 10 كلمات
✅ يبدأ بفعل مضارع أو ماضٍ
✅ جذاب ومباشر
✅ يعكس الزاوية الخبرية بوضوح
❌ تجنب العناوين الطويلة أو المعقدة

**2. المقدمة (Lead):**
✅ سطران فقط (جملتان)
✅ تلخص أبرز معلومة في الخبر
✅ تجيب على: من؟ ماذا؟ متى؟
✅ قوية وجذابة، تدفع للقراءة

**3. الفقرات (Body):**
✅ كل فقرة: 3 أسطر كحد أقصى
✅ تفاصيل دقيقة وواضحة دون إطالة
✅ لا تكرار في المعلومات
✅ ترتيب منطقي: التفاصيل ← الخلفية ← البيانات

**4. فقرة ردود الفعل:**
✅ فقرة موجزة عن:
  - تصريحات الخبراء أو المسؤولين
  - ردود فعل المستخدمين أو المتأثرين
  - آراء المختصين
✅ حيادية تماماً، لا رأي شخصي

**5. الخاتمة (Conclusion):**
✅ فقرة قصيرة واحدة
✅ توضح الأثر المستقبلي أو التوقعات
✅ تربط الخبر بسياق أوسع

**🎯 نغمة الكتابة (Tone):**
✅ حيادية تماماً - لا مبالغة ولا درامية
✅ لغة فصحى حديثة سلسة
✅ واضحة ومباشرة بعيدة عن التكلف
✅ التركيز على المعلومة والفائدة
❌ تجنب العبارات الإنشائية
❌ تجنب المبالغات العاطفية
❌ لا تستخدم كلمات أجنبية إلا بشرح مبسط

**📏 القيود الشكلية:**
- طول المقال: 300-500 كلمة
- طول العنوان: 10 كلمات أو أقل
- طول المقدمة: سطران (جملتان)
- طول كل فقرة: 3 أسطر كحد أقصى

**🔖 الترتيب المطلوب:**
1. العنوان
2. المقدمة (سطران)
3. الفقرة الأولى: التفاصيل الرئيسية
4. الفقرة الثانية: معلومات إضافية/خلفية
5. الفقرة الثالثة: ردود الفعل/التصريحات
6. الخاتمة: الأثر والتوقعات

قدم الإجابة بصيغة JSON:
{
  "title": "عنوان يبدأ بفعل (10 كلمات أو أقل)",
  "content": "المحتوى الكامل مقسم إلى فقرات حسب الترتيب أعلاه"
}

تذكر: الخبر يجب أن يكون جاهزاً للنشر مباشرة في "سبق" دون أي تعديل!`,
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

    // معايير عناوين "سبق" المشتركة
    const sabqHeadlineRules = `
معايير عناوين "سبق" الصحفية:
✅ يبدأ بفعل (مضارع أو ماضٍ)
✅ لا يتجاوز 10 كلمات
✅ واضح ومباشر
✅ يعكس الخبر فوراً
❌ لا تكرار أو حشو
❌ لا عناوين طويلة

العنوان الحالي: ${draftTitle}
مقتطف من المحتوى: ${draftContent.substring(0, 200)}...

اكتب عنواناً واحداً فقط يلتزم بمعايير "سبق" أعلاه.`;

    // GPT-4o headline (formal/official style)
    try {
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "أنت خبير عناوين صحفية في صحيفة سبق. تكتب عناوين رسمية احترافية تبدأ بفعل ولا تتجاوز 10 كلمات.",
          },
          {
            role: "user",
            content: sabqHeadlineRules + `\n\nنمط هذا العنوان: رسمي وموثوق`,
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

    // Claude headline (engaging/dynamic style)
    try {
      const claudeResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: sabqHeadlineRules + `\n\nنمط هذا العنوان: جذاب وديناميكي (لكن ملتزم بالمعايير)`,
          },
        ],
      });

      headlines.push({
        text:
          claudeResponse.content[0].type === "text"
            ? claudeResponse.content[0].text.trim()
            : draftTitle,
        style: "engaging",
        aiModel: "Claude Sonnet 4-5",
      });
    } catch (error) {
      console.error("Claude headline generation failed:", error);
    }

    // Gemini headline (SEO-optimized but still follows Sabq rules)
    try {
      const geminiResponse = await genai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: sabqHeadlineRules + `\n\nنمط هذا العنوان: محسّن لمحركات البحث (SEO) مع الالتزام بمعايير سبق`,
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

    // Keep original from draft
    headlines.push({
      text: draftTitle,
      style: "original",
      aiModel: "Original Draft",
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
