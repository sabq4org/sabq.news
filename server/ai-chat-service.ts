import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIChatService {
  /**
   * تلخيص سلسلة رسائل أو thread
   */
  async summarizeThread(messages: Array<{content: string; senderName: string}>): Promise<string> {
    const messagesText = messages.map(m => `${m.senderName}: ${m.content}`).join('\n');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "أنت مساعد ذكي متخصص في تلخيص المحادثات. اكتب ملخصاً موجزاً بالعربية لهذه المحادثة في نقاط."
      }, {
        role: "user",
        content: `لخص هذه المحادثة:\n\n${messagesText}`
      }],
      temperature: 0.3,
      max_tokens: 500,
    });
    
    return completion.choices[0].message.content || 'فشل التلخيص';
  }
  
  /**
   * اقتراح ردود سريعة ذكية
   */
  async suggestReplies(context: string, count: number = 3): Promise<string[]> {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "أنت مساعد ذكي يقترح ردوداً سريعة مناسبة بالعربية. اقترح ردوداً قصيرة (جملة أو جملتين) ومتنوعة (رسمية وودية)."
      }, {
        role: "user",
        content: `اقترح ${count} ردود مناسبة على هذه الرسالة:\n\n"${context}"\n\nأرجع الردود كقائمة JSON فقط: ["رد 1", "رد 2", "رد 3"]`
      }],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    try {
      const content = completion.choices[0].message.content || '[]';
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
  
  /**
   * فحص السُمّية (Toxicity) في الرسالة
   */
  async checkToxicity(content: string): Promise<{
    isToxic: boolean;
    score: number;
    categories: string[];
    suggestion?: string;
  }> {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "أنت مُحلل محتوى متخصص في كشف الإساءة والكراهية والتحرش في النصوص العربية. حلل النص وأعطِ درجة من 0 (آمن) إلى 1 (سام جداً)."
      }, {
        role: "user",
        content: `حلل هذا النص:\n\n"${content}"\n\nأرجع النتيجة كـ JSON:\n{"isToxic": boolean, "score": number, "categories": ["فئة1", "فئة2"], "suggestion": "اقتراح بديل إن وُجد"}`
      }],
      temperature: 0,
      max_tokens: 300,
    });
    
    try {
      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        isToxic: result.isToxic || false,
        score: result.score || 0,
        categories: result.categories || [],
        suggestion: result.suggestion,
      };
    } catch {
      return { isToxic: false, score: 0, categories: [] };
    }
  }
}

export const aiChatService = new AIChatService();
