import OpenAI from "openai";

const openai = new OpenAI();

export interface ModerationResult {
  score: number; // 0-100
  classification: "safe" | "review" | "reject";
  detected: string[]; // toxicity, hate_speech, spam, etc.
  reason: string;
}

const MODERATION_PROMPT = `أنت نظام رقابة تعليقات لموقع إخباري عربي، مهمتك تحليل النصوص بدقة وتصنيفها وفق سياسات النشر.

حلّل التعليق التالي وقيّمه حسب المعايير التالية:

1. قيّم احتمالية وجود:
   - الإساءة والسباب (toxicity)
   - العنصرية أو خطاب الكراهية (hate_speech)
   - التحرش أو التقليل من الآخرين (harassment)
   - المحتوى الجنسي أو غير اللائق (sexual_content)
   - التهديد أو التحريض (threats)
   - الأخبار الكاذبة أو الادعاءات الخطرة (misinformation)
   - السبام أو الروابط العشوائية (spam)
   - المقارنة الشخصية المسيئة (personal_attack)

2. أرجع نتيجة واحدة فقط من التصنيفات التالية:
   - safe (آمن للنشر)
   - review (يحتاج مراجعة بشرية)
   - reject (مرفوض تمامًا)

3. أرجع درجة رقمية من 0 إلى 100:
   - 80–100 → Safe (آمن)
   - 40–79  → Review (يحتاج مراجعة)
   - 0–39   → Reject (مرفوض)

4. أعد النتيجة فقط بصيغة JSON بهذا الشكل:

{
  "score": رقم,
  "classification": "safe | review | reject",
  "detected": ["toxicity", "hate_speech", "spam"...],
  "reason": "شرح قصير جداً يوضح السبب"
}

النص المطلوب تحليله:`;

export async function moderateComment(commentText: string): Promise<ModerationResult> {
  try {
    console.log(`[Comment Moderation] Analyzing comment: ${commentText.substring(0, 50)}...`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: MODERATION_PROMPT
        },
        {
          role: "user",
          content: `"${commentText}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error("[Comment Moderation] Empty response from AI");
      return {
        score: 50,
        classification: "review",
        detected: ["unknown"],
        reason: "لم يتمكن النظام من تحليل التعليق"
      };
    }

    const result = JSON.parse(content) as ModerationResult;
    
    // Validate and normalize the result
    const normalizedResult: ModerationResult = {
      score: Math.min(100, Math.max(0, result.score || 50)),
      classification: ["safe", "review", "reject"].includes(result.classification) 
        ? result.classification 
        : result.score >= 80 ? "safe" : result.score >= 40 ? "review" : "reject",
      detected: Array.isArray(result.detected) ? result.detected : [],
      reason: result.reason || "تم التحليل بنجاح"
    };

    console.log(`[Comment Moderation] Result: ${normalizedResult.classification} (${normalizedResult.score})`);
    
    return normalizedResult;
  } catch (error) {
    console.error("[Comment Moderation] Error:", error);
    return {
      score: 50,
      classification: "review",
      detected: ["error"],
      reason: "حدث خطأ أثناء تحليل التعليق"
    };
  }
}

export function getStatusFromClassification(classification: string): string {
  switch (classification) {
    case "safe":
      return "approved";
    case "reject":
      return "rejected";
    case "review":
    default:
      return "pending";
  }
}
