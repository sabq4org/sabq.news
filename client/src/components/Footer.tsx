import { Link } from "wouter";
import { 
  Mail, 
  Phone,
  ExternalLink,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Sparkles,
  Brain,
  Zap,
  TrendingUp,
  Globe,
  Database,
  Shield,
  Newspaper,
  LayoutGrid,
  Video,
  Code
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import sabqLogo from "@assets/sabq-logo.png";

type Category = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  status: string;
  displayOrder: number;
};

type AIMetrics = {
  articlesProcessed: number;
  aiSignalsActive: number;
  smartCategoriesCount: number;
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: metrics } = useQuery<AIMetrics>({
    queryKey: ["/api/ai-metrics"],
    retry: false,
  });

  const topCategories = categories
    .filter((cat) => cat.status === "active")
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 4);

  const navigationSections = [
    {
      title: "الأخبار الرئيسية",
      icon: Newspaper,
      links: [
        { label: "عاجل", href: "/breaking" },
        { label: "محليات", href: "/category/local" },
        { label: "العالم", href: "/category/world" },
        { label: "اقتصاد", href: "/category/economy" },
      ],
    },
    {
      title: "الخدمات الذكية",
      icon: Sparkles,
      links: [
        { label: "لحظة بلحظة", href: "/moment-by-moment" },
        { label: "مُقترب", href: "/muqtarib" },
        { label: "المرقاب", href: "/mirqab" },
        { label: "النشرات الصوتية", href: "/audio-newsletters" },
      ],
    },
    {
      title: "محتوى مرئي",
      icon: Video,
      links: [
        { label: "سبق قصير", href: "/shorts" },
        { label: "الأخبار الصوتية", href: "/audio-news" },
        { label: "البودكاست", href: "/podcasts" },
      ],
    },
    {
      title: "للمطورين",
      icon: Code,
      links: [
        { label: "دليل API", href: "/ai-publisher" },
        { label: "سياسة AI", href: "/ai-policy" },
        { label: "OpenAPI Spec", href: "/openapi.json", external: true },
        { label: "AI Usage", href: "/.well-known/ai-usage.json", external: true },
      ],
    },
  ];

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com", testId: "facebook" },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com", testId: "twitter" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com", testId: "instagram" },
    { name: "Youtube", icon: Youtube, href: "https://youtube.com", testId: "youtube" },
    { name: "Linkedin", icon: Linkedin, href: "https://linkedin.com", testId: "linkedin" },
  ];

  return (
    <footer className="bg-footer text-footer-foreground border-t border-border/60" data-testid="footer">
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          "name": "سبق الذكية",
          "alternateName": "Sabq Smart",
          "url": "https://sabq.org",
          "description": "منصة إخبارية عربية ذكية مدعومة بالذكاء الاصطناعي",
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "info@sabq.sa",
            "telephone": "+966-12-345-6789"
          }
        })
      }} />

      {/* Intelligence Banner */}
      <div className="border-b border-border/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-[hsl(var(--ai-primary))] ai-pulse-icon" />
              <div className="text-center lg:text-right">
                <h3 className="text-xl font-bold text-foreground">سبق الذكية</h3>
                <p className="text-xs text-muted-foreground">إخبارك بذكاء اصطناعي</p>
              </div>
            </div>

            {/* AI Metrics */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="h-4 w-4 text-[hsl(var(--ai-primary))]" />
                  <div className="text-lg font-bold text-foreground">
                    {metrics?.articlesProcessed?.toLocaleString('en-US') || '0'}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">مقالة معالجة</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--ai-secondary))]" />
                  <div className="text-lg font-bold text-foreground">
                    {metrics?.aiSignalsActive?.toLocaleString('en-US') || '0'}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">إشارة ذكية</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <LayoutGrid className="h-4 w-4 text-[hsl(var(--ai-primary))]" />
                  <div className="text-lg font-bold text-foreground">
                    {metrics?.smartCategoriesCount?.toLocaleString('en-US') || '0'}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">تصنيف ذكي</div>
              </div>
            </div>

            {/* CTA */}
            <Link href="/ai-publisher">
              <Button 
                className="bg-[hsl(var(--ai-primary))] hover:bg-[hsl(var(--ai-primary)/.9)] text-white gap-2"
                data-testid="footer-cta-ai-publisher"
              >
                <Globe className="h-4 w-4" />
                استكشف API
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-border/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {navigationSections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <div key={index} data-testid={`footer-section-${index}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <IconComponent className="h-5 w-5 text-[hsl(var(--ai-primary))]" />
                    <h4 className="font-semibold text-foreground">{section.title}</h4>
                  </div>
                  <ul className="space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-colors inline-flex items-center gap-1 group py-2 md:py-0"
                            data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                          >
                            <ExternalLink className="h-3 w-3 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-sm text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-colors inline-flex items-center gap-1 group py-2 md:py-0"
                            data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                          >
                            <ChevronRight className="h-3 w-3 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Smart Categories Strip */}
          {topCategories.length > 0 && (
            <div className="border-t border-border/50 pt-6 mt-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[hsl(var(--ai-primary))]" />
                  <span className="text-sm font-medium text-foreground">التصنيفات الذكية</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topCategories.map((category) => (
                    <Link key={category.id} href={`/category/${category.slug}`}>
                      <Badge 
                        variant="secondary" 
                        className="hover:bg-[hsl(var(--ai-primary)/.1)] hover:text-[hsl(var(--ai-primary))] hover:border-[hsl(var(--ai-primary)/.3)] transition-all cursor-pointer"
                        data-testid={`footer-category-${category.slug}`}
                      >
                        {category.nameAr}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand Info */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <Link href="/" data-testid="footer-logo">
                <img 
                  src={sabqLogo} 
                  alt="سبق الذكية" 
                  className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity"
                />
              </Link>
              <div className="flex flex-col md:flex-row items-center gap-3 text-xs text-muted-foreground">
                <p data-testid="footer-copyright">
                  © {currentYear.toLocaleString('en-US')} سبق الذكية
                </p>
                <Separator orientation="vertical" className="hidden md:block h-3" />
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  <span>Sabq-AI-Use-1.0</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-col items-center md:items-start gap-2 text-sm">
              <a 
                href="mailto:info@sabq.sa"
                className="flex items-center gap-2 text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-colors"
                data-testid="footer-email"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>info@sabq.sa</span>
              </a>
              <a 
                href="tel:+966123456789"
                className="flex items-center gap-2 text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-colors"
                data-testid="footer-phone"
              >
                <Phone className="h-3.5 w-3.5" />
                <span dir="ltr">+966 12 345 6789</span>
              </a>
            </div>

            {/* Social + Legal */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.testId}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full hover:bg-[hsl(var(--ai-primary)/.1)] text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-all"
                    aria-label={social.name}
                    data-testid={`footer-social-${social.testId}`}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground transition-colors py-2 md:py-0" data-testid="footer-link-privacy">
                  الخصوصية
                </Link>
                <Separator orientation="vertical" className="h-3" />
                <Link href="/terms" className="hover:text-foreground transition-colors py-2 md:py-0" data-testid="footer-link-terms">
                  الشروط
                </Link>
                <Separator orientation="vertical" className="h-3" />
                <Link href="/cookies" className="hover:text-foreground transition-colors py-2 md:py-0" data-testid="footer-link-cookies">
                  الملفات
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
