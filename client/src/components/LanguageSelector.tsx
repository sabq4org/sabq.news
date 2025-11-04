import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          data-testid="button-language-selector"
          className="hover-elevate active-elevate-2"
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">تبديل اللغة / Switch Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLanguage('ar')}
          data-testid="menu-item-arabic"
          className="cursor-pointer flex items-center gap-2"
        >
          {language === 'ar' && <Check className="h-4 w-4" />}
          <span className={language === 'ar' ? 'font-bold' : ''}>العربية</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          data-testid="menu-item-english"
          className="cursor-pointer flex items-center gap-2"
        >
          {language === 'en' && <Check className="h-4 w-4" />}
          <span className={language === 'en' ? 'font-bold' : ''}>English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
