import { Link } from "wouter";
import { Mail, Phone, Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import sabqLogo from "@assets/sabq-logo.png";

type Category = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  displayOrder: number;
  status: string;
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const activeCategories = categories
    .filter((cat) => cat.status === "active")
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 6);

  const sections = {
    about: [
      { label: "من نحن", href: "/about" },
      { label: "اتصل بنا", href: "/contact" },
      { label: "الشروط والأحكام", href: "/terms" },
      { label: "سياسة الخصوصية", href: "/privacy" },
    ],
    services: [
      { label: "لحظة بلحظة", href: "/moment-by-moment" },
      { label: "مُقترب", href: "/muqtarib" },
      { label: "جميع التصنيفات", href: "/categories" },
      { label: "الأخبار", href: "/" },
    ],
  };

  const socialMedia = [
    { name: "فيسبوك", icon: Facebook, href: "https://facebook.com", color: "hover:text-[#1877F2]", testId: "facebook" },
    { name: "تويتر", icon: Twitter, href: "https://twitter.com", color: "hover:text-[#1DA1F2]", testId: "twitter" },
    { name: "إنستغرام", icon: Instagram, href: "https://instagram.com", color: "hover:text-[#E4405F]", testId: "instagram" },
    { name: "يوتيوب", icon: Youtube, href: "https://youtube.com", color: "hover:text-[#FF0000]", testId: "youtube" },
    { name: "لينكدإن", icon: Linkedin, href: "https://linkedin.com", color: "hover:text-[#0A66C2]", testId: "linkedin" },
  ];

  const getServiceTestId = (href: string) => {
    if (href === "/") return "footer-service-home";
    return `footer-service-${href.replace(/\//g, '').replace(/-/g, '')}`;
  };

  return (
    <footer className="relative bg-gradient-to-b from-card/30 via-card/50 to-card border-t border-border/40 mt-auto overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10 mb-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link href="/" data-testid="footer-logo">
              <div className="flex items-center gap-3 mb-4 group cursor-pointer">
                <img 
                  src={sabqLogo} 
                  alt="سبق الذكية" 
                  className="h-10 sm:h-12 w-auto transition-all duration-300 group-hover:scale-105 group-hover:brightness-110 dark:brightness-110"
                />
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed max-w-md">
              منصة إخبارية عربية ذكية تقدم أحدث الأخبار والتحليلات المدعومة بالذكاء الاصطناعي. 
              نسعى لتقديم تجربة إخبارية فريدة ومخصصة لكل قارئ.
            </p>
            <div className="space-y-2.5">
              <a 
                href="mailto:info@sabq.sa" 
                className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover-elevate active-elevate-2 rounded-md px-2 py-1.5 -mx-2 transition-all duration-200"
                data-testid="footer-email"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@sabq.sa</span>
              </a>
              <a 
                href="tel:+966123456789" 
                className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover-elevate active-elevate-2 rounded-md px-2 py-1.5 -mx-2 transition-all duration-200"
                data-testid="footer-phone"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span dir="ltr">+966 12 345 6789</span>
              </a>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h4 className="font-bold text-sm sm:text-base mb-4 text-foreground border-b border-border/30 pb-2" aria-label="عن الموقع">
              عن الموقع
            </h4>
            <ul className="space-y-2.5">
              {sections.about.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all duration-200 inline-block"
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
            <h4 className="font-bold text-sm sm:text-base mb-4 text-foreground border-b border-border/30 pb-2" aria-label="الأقسام">
              الأقسام
            </h4>
            <ul className="space-y-2.5">
              {isLoading ? (
                <li className="text-xs sm:text-sm text-muted-foreground/50">جاري التحميل...</li>
              ) : activeCategories.length > 0 ? (
                activeCategories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/category/${category.slug}`}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all duration-200 inline-block"
                      data-testid={`footer-category-${category.slug}`}
                    >
                      {category.nameAr}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-xs sm:text-sm text-muted-foreground/50">لا توجد أقسام</li>
              )}
            </ul>
          </div>

          {/* Services Section */}
          <div>
            <h4 className="font-bold text-sm sm:text-base mb-4 text-foreground border-b border-border/30 pb-2" aria-label="الخدمات">
              الخدمات
            </h4>
            <ul className="space-y-2.5">
              {sections.services.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all duration-200 inline-block"
                    data-testid={getServiceTestId(item.href)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-6 sm:my-8 opacity-30" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
          {/* Copyright */}
          <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-right order-2 md:order-1">
            <p data-testid="footer-copyright">
              © {currentYear} سبق الذكية. جميع الحقوق محفوظة.
            </p>
          </div>

          {/* Social Media */}
          <div className="flex items-center gap-3 sm:gap-4 order-1 md:order-2">
            <span className="text-xs sm:text-sm text-muted-foreground font-medium hidden sm:inline">
              تابعنا:
            </span>
            <div className="flex items-center gap-2 sm:gap-2.5">
              {socialMedia.map((social) => (
                <a
                  key={social.testId}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 sm:p-2.5 rounded-lg bg-muted/40 hover-elevate active-elevate-2 transition-all duration-200 ${social.color}`}
                  aria-label={social.name}
                  data-testid={`footer-social-${social.testId}`}
                >
                  <social.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
