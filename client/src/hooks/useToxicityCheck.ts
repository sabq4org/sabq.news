import { useState } from "react";

interface ToxicityCheckResult {
  allowed: boolean;
  message?: string;
  suggestion?: string;
  categories?: string[];
  score?: number;
}

export function useToxicityCheck() {
  const [isChecking, setIsChecking] = useState(false);
  
  const checkContent = async (content: string): Promise<ToxicityCheckResult> => {
    if (!content.trim()) {
      return { allowed: true };
    }

    setIsChecking(true);
    try {
      const response = await fetch('/api/chat/ai/check-toxicity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        return { allowed: true };
      }

      const result = await response.json();
      
      if (result.isToxic && result.score > 0.7) {
        return {
          allowed: false,
          message: 'هذه الرسالة قد تحتوي على محتوى غير لائق',
          suggestion: result.suggestion,
          categories: result.categories,
          score: result.score,
        };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('خطأ في فحص المحتوى:', error);
      return { allowed: true };
    } finally {
      setIsChecking(false);
    }
  };
  
  return { checkContent, isChecking };
}
