import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { useLocation } from "wouter";

const languages = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦', path: '/' },
  { code: 'en', name: 'English', flag: '🇬🇧', path: '/en' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', path: '/ur' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [location, navigate] = useLocation();

  // Detect current language from URL path
  const getCurrentLang = () => {
    if (location.startsWith('/en')) return 'en';
    if (location.startsWith('/ur')) return 'ur';
    return 'ar';
  };
  
  const currentLang = getCurrentLang();
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  const handleLanguageChange = (lang: typeof languages[0]) => {
    setLanguage(lang.code);
    navigate(lang.path);
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
            {currentLanguage.flag} {currentLanguage.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang)}
            className="gap-2 cursor-pointer"
            data-testid={`menu-item-lang-${lang.code}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
            {currentLang === lang.code && (
              <Check className="w-4 h-4 ml-auto text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
