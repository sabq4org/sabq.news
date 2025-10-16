import { Link } from "wouter";
import { Mail, Phone, Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const sections = {
    about: [
      { label: "من نحن", href: "#about" },
      { label: "اتصل بنا", href: "#contact" },
      { label: "الشروط والأحكام", href: "#terms" },
      { label: "سياسة الخصوصية", href: "#privacy" },
    ],
    categories: [
      { label: "سياسة", href: "#politics" },
      { label: "اقتصاد", href: "#economy" },
      { label: "رياضة", href: "#sports" },
      { label: "تقنية", href: "#tech" },
      { label: "ثقافة وفن", href: "#culture" },
    ],
    services: [
      { label: "مُقترب", href: "/muqtarib" },
      { label: "جميع التصنيفات", href: "#categories" },
      { label: "الأخبار", href: "/" },
      { label: "تطبيق الجوال", href: "#app" },
    ],
  };

  const socialMedia = [
    { name: "فيسبوك", icon: Facebook, href: "#", color: "hover:text-[#1877F2]" },
    { name: "تويتر", icon: Twitter, href: "#", color: "hover:text-[#1DA1F2]" },
    { name: "إنستغرام", icon: Instagram, href: "#", color: "hover:text-[#E4405F]" },
    { name: "يوتيوب", icon: Youtube, href: "#", color: "hover:text-[#FF0000]" },
    { name: "لينكدإن", icon: Linkedin, href: "#", color: "hover:text-[#0A66C2]" },
  ];

  return (
    <footer className="bg-card/50 dark:bg-card border-t border-border/50 dark:border-border mt-auto">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-4 sm:mb-5">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link href="/" data-testid="footer-logo">
              <div className="flex items-center gap-2 mb-2 sm:mb-3 group cursor-pointer">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base sm:text-lg transition-transform group-hover:scale-105">
                  س
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">سبق الذكية</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">منصة الأخبار الذكية</p>
                </div>
              </div>
            </Link>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 leading-relaxed">
              منصة إخبارية عربية ذكية تقدم أحدث الأخبار والتحليلات المدعومة بالذكاء الاصطناعي. 
              نسعى لتقديم تجربة إخبارية فريدة ومخصصة لكل قارئ.
            </p>
            <div className="space-y-1 sm:space-y-1.5">
              <a 
                href="mailto:info@sabq.sa" 
                className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-email"
              >
                <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                info@sabq.sa
              </a>
              <a 
                href="tel:+966123456789" 
                className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-phone"
              >
                <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                966123456789+
              </a>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 text-foreground">عن الموقع</h4>
            <ul className="space-y-1 sm:space-y-1.5">
              {sections.about.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`footer-link-${item.href.replace('/', '')}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories Section */}
          <div>
            <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 text-foreground">الأقسام</h4>
            <ul className="space-y-1 sm:space-y-1.5">
              {sections.categories.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`footer-category-${item.href.split('/').pop()}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Section */}
          <div>
            <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 text-foreground">الخدمات</h4>
            <ul className="space-y-1 sm:space-y-1.5">
              {sections.services.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`footer-service-${item.href.replace('/', '').replace('#', 'app')}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-3 sm:my-4 opacity-50" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Copyright */}
          <div className="text-[10px] sm:text-xs text-muted-foreground text-center md:text-right">
            <p data-testid="footer-copyright">
              © {currentYear} سبق الذكية. جميع الحقوق محفوظة.
            </p>
          </div>

          {/* Social Media */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden md:inline">تابعنا:</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {socialMedia.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-1.5 rounded-lg bg-muted/60 dark:bg-muted hover-elevate active-elevate-2 transition-colors ${social.color}`}
                  aria-label={social.name}
                  data-testid={`footer-social-${social.name.toLowerCase()}`}
                >
                  <social.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
