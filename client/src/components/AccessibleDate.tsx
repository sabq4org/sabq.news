import { useLanguage } from "@/contexts/LanguageContext";

interface AccessibleDateProps {
  date: Date | string;
  format?: "full" | "short" | "relative";
  className?: string;
  "data-testid"?: string;
}

/**
 * Accessible date display component optimized for Arabic screen readers
 * Uses aria-roledescription to ensure proper pronunciation
 */
export function AccessibleDate({ 
  date, 
  format = "full", 
  className = "",
  "data-testid": testId
}: AccessibleDateProps) {
  const { language } = useLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Format date based on language
  const getFormattedDate = () => {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    
    if (format === "short") {
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    if (format === "relative") {
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (language === 'ar') {
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
      }
      
      // Fallback to short format for older dates
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Full format
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formattedDate = getFormattedDate();
  
  // Get accessible label based on language
  const getAriaLabel = () => {
    if (language === 'ar') {
      return format === "relative" ? "وقت النشر" : "تاريخ النشر";
    }
    return format === "relative" ? "Publication time" : "Publication date";
  };

  return (
    <time
      dateTime={dateObj.toISOString()}
      aria-label={`${getAriaLabel()}: ${formattedDate}`}
      className={className}
      data-testid={testId}
    >
      {formattedDate}
    </time>
  );
}

/**
 * Accessible time display component
 */
export function AccessibleTime({ 
  date, 
  className = "",
  "data-testid": testId
}: AccessibleDateProps) {
  const { language } = useLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formattedTime = dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });

  const ariaLabel = language === 'ar' ? "الوقت" : "Time";

  return (
    <time
      dateTime={dateObj.toISOString()}
      aria-label={`${ariaLabel}: ${formattedTime}`}
      className={className}
      data-testid={testId}
    >
      {formattedTime}
    </time>
  );
}
