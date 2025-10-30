import { Link } from "wouter";
import { 
  Mail, 
  Phone, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin,
  Terminal,
  Code2,
  FileJson2,
  Shield,
  BookOpen,
  Rss
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
    .slice(0, 5);

  const sections = {
    about: [
      { label: "من نحن", href: "/about" },
      { label: "اتصل بنا", href: "/contact" },
      { label: "سياسة الخصوصية", href: "/privacy" },
      { label: "الشروط والأحكام", href: "/terms" },
    ],
    services: [
      { label: "لحظة بلحظة", href: "/moment-by-moment" },
      { label: "مُقترب", href: "/muqtarib" },
      { label: "المرقاب", href: "/mirqab" },
      { label: "سبق قصير", href: "/shorts" },
    ],
    developer: [
      { 
        label: "دليل المطورين", 
        href: "/ai-publisher", 
        icon: Terminal,
        badge: "API",
        description: "وثائق REST API"
      },
      { 
        label: "سياسة AI", 
        href: "/ai-policy", 
        icon: Shield,
        badge: "Policy",
        description: "شروط الاستخدام"
      },
      { 
        label: "AI Usage JSON", 
        href: "/.well-known/ai-usage.json", 
        icon: FileJson2,
        badge: "JSON",
        description: "ملف قابل للقراءة الآلية",
        external: true
      },
      { 
        label: "OpenAPI Spec", 
        href: "/openapi.json", 
        icon: Code2,
        badge: "3.0",
        description: "مواصفات OpenAPI",
        external: true
      },
    ],
  };

  const socialMedia = [
    { name: "فيسبوك", icon: Facebook, href: "https://facebook.com", color: "hover:text-[#1877F2]", testId: "facebook" },
    { name: "تويتر", icon: Twitter, href: "https://twitter.com", color: "hover:text-[#1DA1F2]", testId: "twitter" },
    { name: "إنستغرام", icon: Instagram, href: "https://instagram.com", color: "hover:text-[#E4405F]", testId: "instagram" },
    { name: "يوتيوب", icon: Youtube, href: "https://youtube.com", color: "hover:text-[#FF0000]", testId: "youtube" },
    { name: "لينكدإن", icon: Linkedin, href: "https://linkedin.com", color: "hover:text-[#0A66C2]", testId: "linkedin" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-muted/60 via-muted/80 to-muted border-t border-border/40 mt-auto" data-testid="footer">
      {/* Structured Data - Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          "name": "سبق الذكية",
          "alternateName": "Sabq Smart",
          "url": "https://sabq.org",
          "logo": "https://sabq.org/logo.png",
          "description": "منصة إخبارية عربية ذكية مدعومة بالذكاء الاصطناعي",
          "publishingPrinciples": "https://sabq.org/ai-policy",
          "actionableFeedbackPolicy": "https://sabq.org/contact",
          "correctionsPolicy": "https://sabq.org/terms",
          "diversityPolicy": "https://sabq.org/about",
          "ethicsPolicy": "https://sabq.org/ai-policy",
          "masthead": "https://sabq.org/about",
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "info@sabq.sa",
            "telephone": "+966-12-345-6789",
            "contactType": "customer service"
          },
          "sameAs": [
            "https://facebook.com",
            "https://twitter.com",
            "https://instagram.com",
            "https://youtube.com",
            "https://linkedin.com"
          ]
        })
      }} />

      {/* Mobile Version */}
      <div className="lg:hidden container mx-auto px-4 py-8 space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" data-testid="footer-logo">
            <div className="inline-flex items-center gap-2 group cursor-pointer">
              <img 
                src={sabqLogo} 
                alt="سبق الذكية" 
                className="h-10 w-auto transition-all duration-300 group-hover:scale-105 dark:brightness-110"
              />
            </div>
          </Link>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            منصة إخبارية عربية ذكية مدعومة بالذكاء الاصطناعي
          </p>
        </div>

        {/* Developer Resources - مميز على الموبايل */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-sm">موارد المطورين</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sections.developer.map((item) => (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs p-2 rounded hover-elevate"
                  data-testid={`footer-dev-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <item.icon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 text-xs p-2 rounded hover-elevate"
                  data-testid={`footer-dev-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <item.icon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <a 
            href="mailto:info@sabq.sa" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="footer-email"
          >
            <Mail className="h-4 w-4" />
            <span>info@sabq.sa</span>
          </a>
          <a 
            href="tel:+966123456789" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="footer-phone"
          >
            <Phone className="h-4 w-4" />
            <span dir="ltr">+966 12 345 6789</span>
          </a>
        </div>

        {/* Social Media */}
        <div className="flex items-center justify-center gap-2">
          {socialMedia.map((social) => (
            <a
              key={social.testId}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg bg-muted/40 hover-elevate transition-all duration-200 ${social.color}`}
              aria-label={social.name}
              data-testid={`footer-social-${social.testId}`}
            >
              <social.icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <Separator className="opacity-30" />

        {/* Copyright */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground" data-testid="footer-copyright">
            © {currentYear.toLocaleString('en-US')} سبق الذكية. جميع الحقوق محفوظة.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {sections.about.map((item, idx) => (
              <Link 
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`footer-link-${item.href.replace('/', '')}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Version */}
      <div className="hidden lg:block container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-10">
          {/* Column 1 & 2: Brand + Developer Resources (Highlighted) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Brand */}
            <div>
              <Link href="/" data-testid="footer-logo">
                <div className="flex items-center gap-3 mb-4 group cursor-pointer">
                  <img 
                    src={sabqLogo} 
                    alt="سبق الذكية" 
                    className="h-12 w-auto transition-all duration-300 group-hover:scale-105 dark:brightness-110"
                  />
                </div>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                منصة إخبارية عربية ذكية تقدم أحدث الأخبار والتحليلات المدعومة بالذكاء الاصطناعي مع تجربة إخبارية فريدة ومخصصة.
              </p>
            </div>

            {/* Developer Resources - مميز */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Terminal className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">موارد المطورين</h4>
                  <p className="text-xs text-muted-foreground">AI-Ready APIs</p>
                </div>
              </div>
              <div className="space-y-2">
                {sections.developer.map((item) => (
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2.5 p-2.5 rounded-lg hover-elevate transition-all"
                      data-testid={`footer-dev-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary group-hover:scale-110 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-start gap-2.5 p-2.5 rounded-lg hover-elevate transition-all"
                      data-testid={`footer-dev-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary group-hover:scale-110 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: عن الموقع */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              عن الموقع
            </h4>
            <ul className="space-y-2.5">
              {sections.about.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all duration-200 inline-block"
                    data-testid={`footer-link-${item.href.replace('/', '')}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: الأقسام */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-foreground flex items-center gap-2">
              <Rss className="h-4 w-4" />
              الأقسام
            </h4>
            <ul className="space-y-2.5">
              {isLoading ? (
                <li className="text-sm text-muted-foreground/50">جاري التحميل...</li>
              ) : activeCategories.length > 0 ? (
                activeCategories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/category/${category.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all duration-200 inline-block"
                      data-testid={`footer-category-${category.slug}`}
                    >
                      {category.nameAr}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground/50">لا توجد أقسام</li>
              )}
            </ul>
          </div>

          {/* Column 5: الخدمات */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-foreground">الخدمات</h4>
            <ul className="space-y-2.5">
              {sections.services.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all duration-200 inline-block"
                    data-testid={`footer-service-${item.href.replace(/\//g, '').replace(/-/g, '')}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 6: التواصل */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-foreground">تواصل معنا</h4>
            <div className="space-y-3">
              <a 
                href="mailto:info@sabq.sa" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate rounded-md px-2 py-1.5 -mx-2 transition-all"
                data-testid="footer-email"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">info@sabq.sa</span>
              </a>
              <a 
                href="tel:+966123456789" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate rounded-md px-2 py-1.5 -mx-2 transition-all"
                data-testid="footer-phone"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs" dir="ltr">+966 12 345 6789</span>
              </a>

              {/* Social Media */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">تابعنا:</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {socialMedia.map((social) => (
                    <a
                      key={social.testId}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg bg-muted/40 hover-elevate active-elevate-2 transition-all ${social.color}`}
                      aria-label={social.name}
                      data-testid={`footer-social-${social.testId}`}
                    >
                      <social.icon className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 opacity-30" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p data-testid="footer-copyright">
              © {currentYear.toLocaleString('en-US')} سبق الذكية. جميع الحقوق محفوظة.
            </p>
            <p className="text-xs mt-1 opacity-75">
              مرخص بموجب Sabq-AI-Use-1.0
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              الخصوصية
            </Link>
            <span className="text-border">•</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              الشروط
            </Link>
            <span className="text-border">•</span>
            <Link href="/ai-policy" className="hover:text-foreground transition-colors">
              سياسة AI
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
