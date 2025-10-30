import { Link } from "wouter";
import { 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
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

export function Footer() {
  const currentYear = new Date().getFullYear();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const topCategories = categories
    .filter((cat) => cat.status === "active")
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 6);

  const links = {
    platform: [
      { label: "من نحن", href: "/about" },
      { label: "اتصل بنا", href: "/contact" },
      { label: "فريق العمل", href: "/team" },
      { label: "الوظائف", href: "/careers" },
    ],
    features: [
      { label: "لحظة بلحظة", href: "/moment-by-moment" },
      { label: "مُقترب", href: "/muqtarib" },
      { label: "المرقاب", href: "/mirqab" },
      { label: "سبق قصير", href: "/shorts" },
    ],
    developers: [
      { label: "دليل API", href: "/ai-publisher" },
      { label: "سياسة AI", href: "/ai-policy" },
      { label: "OpenAPI Spec", href: "/openapi.json", external: true },
      { label: "AI Usage", href: "/.well-known/ai-usage.json", external: true },
    ],
    legal: [
      { label: "سياسة الخصوصية", href: "/privacy" },
      { label: "الشروط والأحكام", href: "/terms" },
      { label: "سياسة الملفات", href: "/cookies" },
    ],
  };

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com", testId: "facebook" },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com", testId: "twitter" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com", testId: "instagram" },
    { name: "Youtube", icon: Youtube, href: "https://youtube.com", testId: "youtube" },
    { name: "Linkedin", icon: Linkedin, href: "https://linkedin.com", testId: "linkedin" },
  ];

  return (
    <footer className="bg-background border-t" data-testid="footer">
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

      <div className="container mx-auto px-4 py-12 lg:py-16">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          
          {/* Brand Section - Takes 3 columns on desktop */}
          <div className="lg:col-span-3">
            <Link href="/" data-testid="footer-logo">
              <img 
                src={sabqLogo} 
                alt="سبق الذكية" 
                className="h-10 w-auto mb-4 transition-opacity hover:opacity-80"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              منصة إخبارية عربية ذكية تقدم أحدث الأخبار بدعم من الذكاء الاصطناعي
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <a 
                href="mailto:info@sabq.sa"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                data-testid="footer-email"
              >
                <Mail className="h-4 w-4" />
                <span>info@sabq.sa</span>
              </a>
              <a 
                href="tel:+966123456789"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                data-testid="footer-phone"
              >
                <Phone className="h-4 w-4" />
                <span dir="ltr">+966 12 345 6789</span>
              </a>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>الرياض، المملكة العربية السعودية</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.testId}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.name}
                    data-testid={`footer-social-${social.testId}`}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links Sections - 9 columns split into 3 */}
          
          {/* Platform */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm mb-4">المنصة</h4>
            <ul className="space-y-3">
              {links.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                    data-testid={`footer-link-${link.href.replace('/', '')}`}
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm mb-4">المميزات</h4>
            <ul className="space-y-3">
              {links.features.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                    data-testid={`footer-service-${link.href.replace(/\//g, '').replace(/-/g, '')}`}
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm mb-4">الأقسام</h4>
            <ul className="space-y-3">
              {topCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                    data-testid={`footer-category-${category.slug}`}
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                    {category.nameAr}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm mb-4">المطورين</h4>
            <ul className="space-y-3">
              {links.developers.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                      data-testid={`footer-dev-${link.label.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <ExternalLink className="h-3 w-3 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                      data-testid={`footer-dev-${link.label.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <ChevronRight className="h-3 w-3 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-sm mb-4">قانوني</h4>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                    data-testid={`footer-link-${link.href.replace('/', '')}`}
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -mr-4 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p data-testid="footer-copyright">
            © {currentYear.toLocaleString('en-US')} سبق الذكية. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs">
            مرخص بموجب Sabq-AI-Use-1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
