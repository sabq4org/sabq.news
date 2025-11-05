import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLocation } from "wouter";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [location, navigate] = useLocation();

  // Detect current language from URL path
  const isEnglishPage = location.startsWith('/en');
  const currentLang = isEnglishPage ? 'en' : 'ar';

  const toggleLanguage = () => {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    
    // Navigate to corresponding language route
    if (newLang === "en") {
      navigate("/en");
    } else {
      navigate("/");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={toggleLanguage}
      data-testid="button-language-switcher"
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">
        {currentLang === "ar" ? "English" : "العربية"}
      </span>
    </Button>
  );
}
