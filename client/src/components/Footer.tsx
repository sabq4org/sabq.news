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
  Code,
  Shield,
  Newspaper,
  LayoutGrid,
  Mic,
  Video
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

  const navigationCards = [
    {
      title: "الأخبار الرئيسية",
      icon: Newspaper,
      description: "تغطية شاملة للأحداث",
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
      description: "تجربة إخبارية مدعومة بالذكاء الاصطناعي",
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
      description: "فيديو وصوتيات",
      links: [
        { label: "سبق قصير", href: "/shorts" },
        { label: "الأخبار الصوتية", href: "/audio-news" },
        { label: "البودكاست", href: "/podcasts" },
      ],
    },
    {
      title: "AI & التطوير",
      icon: Code,
      description: "موارد للمطورين والذكاء الاصطناعي",
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
    <footer className="bg-background" data-testid="footer">
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

      {/* TIER 1: Hero Intelligence Banner */}
      <div className="ai-gradient-bg ai-gradient-animate border-t border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Branding + Tagline */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-8 w-8 text-[hsl(var(--ai-primary))] ai-pulse-icon" />
                <div>
                  <h3 className="text-2xl font-bold text-foreground">سبق الذكية</h3>
                  <p className="text-sm text-muted-foreground">إخبارك بذكاء اصطناعي</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                منصة إخبارية عربية ذكية تقدم أحدث الأخبار بدعم من الذكاء الاصطناعي، مع تحليلات متقدمة وتوصيات شخصية
              </p>
              
              {/* Contact */}
              <div className="flex flex-wrap gap-4 text-sm">
                <a 
                  href="mailto:info@sabq.sa"
                  className="flex items-center gap-2 text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-colors min-h-8 py-1"
                  data-testid="footer-email"
                >
                  <Mail className="h-4 w-4" />
                  <span>info@sabq.sa</span>
                </a>
                <a 
                  href="tel:+966123456789"
                  className="flex items-center gap-2 text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-colors min-h-8 py-1"
                  data-testid="footer-phone"
                >
                  <Phone className="h-4 w-4" />
                  <span dir="ltr">+966 12 345 6789</span>
                </a>
              </div>
            </div>

            {/* Center: AI Metrics */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-5 w-5 text-[hsl(var(--ai-primary))] ai-float-icon" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {metrics?.articlesProcessed?.toLocaleString('en-US') || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">مقالة معالجة</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-[hsl(var(--ai-secondary))] ai-float-icon" style={{ animationDelay: '0.5s' }} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {metrics?.aiSignalsActive?.toLocaleString('en-US') || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">إشارة ذكاء نشطة</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <LayoutGrid className="h-5 w-5 text-[hsl(var(--ai-primary))] ai-float-icon" style={{ animationDelay: '1s' }} />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {metrics?.smartCategoriesCount?.toLocaleString('en-US') || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">تصنيف ذكي</div>
                </div>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="lg:col-span-3 text-center lg:text-left">
              <Link href="/ai-publisher">
                <Button 
                  className="bg-[hsl(var(--ai-primary))] hover:bg-[hsl(var(--ai-primary)/.9)] text-white gap-2"
                  data-testid="footer-cta-ai-publisher"
                >
                  <Globe className="h-4 w-4" />
                  استكشف API الذكي
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                للمطورين والذكاء الاصطناعي
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TIER 2: Intelligent Navigation Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {navigationCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover-elevate transition-all duration-300 ai-glow-border group"
                data-testid={`footer-card-${index}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-[hsl(var(--ai-primary)/.1)] text-[hsl(var(--ai-primary))] group-hover:scale-110 transition-transform">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{card.title}</h4>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {card.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-colors inline-flex items-center gap-1 group/link min-h-8 py-1"
                          data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                        >
                          <ExternalLink className="h-3 w-3 opacity-0 -mr-4 group-hover/link:opacity-100 group-hover/link:mr-0 transition-all" />
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-colors inline-flex items-center gap-1 group/link min-h-8 py-1"
                          data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                        >
                          <ChevronRight className="h-3 w-3 opacity-0 -mr-4 group-hover/link:opacity-100 group-hover/link:mr-0 transition-all" />
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* Smart Categories Strip */}
        {topCategories.length > 0 && (
          <div className="border-t border-b border-[hsl(var(--ai-primary)/.2)] bg-[hsl(var(--ai-primary)/.05)] py-6 mb-8">
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
                      className="hover:bg-[hsl(var(--ai-primary)/.1)] hover:text-[hsl(var(--ai-primary))] hover:border-[hsl(var(--ai-primary)/.3)] transition-all cursor-pointer min-h-8"
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

      {/* TIER 3: Utility Bar */}
      <div className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Copyright & License */}
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
              <p data-testid="footer-copyright">
                © {currentYear.toLocaleString('en-US')} سبق الذكية. جميع الحقوق محفوظة.
              </p>
              <Separator orientation="vertical" className="hidden md:block h-4" />
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span className="text-xs">Sabq-AI-Use-1.0</span>
              </div>
            </div>

            {/* Center: Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.testId}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-[hsl(var(--ai-primary)/.1)] text-muted-foreground hover:text-[hsl(var(--ai-primary))] transition-all min-w-8 min-h-8 inline-flex items-center justify-center"
                  aria-label={social.name}
                  data-testid={`footer-social-${social.testId}`}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Right: Legal Links */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors min-h-8 inline-flex items-center py-1" data-testid="footer-link-privacy">
                الخصوصية
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors min-h-8 inline-flex items-center py-1" data-testid="footer-link-terms">
                الشروط
              </Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors min-h-8 inline-flex items-center py-1" data-testid="footer-link-cookies">
                الملفات
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
