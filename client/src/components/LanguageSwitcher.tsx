import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [location, navigate] = useLocation();

  // Detect current language from URL path
  const isEnglishPage = location.startsWith('/en');
  const currentLang = isEnglishPage ? 'en' : 'ar';

  const switchLanguage = (newLang: "ar" | "en") => {
    setLanguage(newLang);
    
    // Navigate to corresponding language route
    if (newLang === "en") {
      navigate("/en");
    } else {
      navigate("/");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          data-testid="button-language-switcher"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">
            {currentLang === "ar" ? "English" : "العربية"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchLanguage("ar")}
          className={language === "ar" ? "bg-accent" : ""}
          data-testid="option-arabic"
        >
          <Languages className="w-4 h-4 mr-2" />
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLanguage("en")}
          className={language === "en" ? "bg-accent" : ""}
          data-testid="option-english"
        >
          <Languages className="w-4 h-4 mr-2" />
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
