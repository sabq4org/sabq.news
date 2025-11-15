import { Link } from "wouter";
import { 
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin
} from "lucide-react";
import sabqLogo from "@assets/sabq-logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "الرئيسية", href: "/" },
    { label: "الأخبار", href: "/news" },
    { label: "التصنيفات", href: "/categories" },
    { label: "لحظة بلحظة", href: "/moment-by-moment" },
    { label: "المرقاب", href: "/mirqab" },
    { label: "مقالات", href: "/articles" },
    { label: "عن سبق", href: "/about" },
  ];

  const servicesLinks = [
    { label: "عمق", href: "/omq" },
    { label: "سبق قصير", href: "/shorts" },
    { label: "النشرات الصوتية", href: "/audio-newsletters" },
  ];

  const developersLinks = [
    { label: "دليل API", href: "/ai-publisher" },
    { label: "OpenAPI Spec", href: "/openapi.json", external: true },
  ];

  const legalLinks = [
    { label: "الخصوصية", href: "/privacy" },
    { label: "الشروط", href: "/terms" },
    { label: "الملفات", href: "/cookies" },
  ];

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com", testId: "facebook" },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com", testId: "twitter" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com", testId: "instagram" },
    { name: "Youtube", icon: Youtube, href: "https://youtube.com", testId: "youtube" },
    { name: "Linkedin", icon: Linkedin, href: "https://linkedin.com", testId: "linkedin" },
  ];

  return (
    <footer className="bg-footer border-t border-border" data-testid="footer" dir="rtl">
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          "name": "سبق الذكية",
          "alternateName": "Sabq Smart",
          "url": "https://sabq.org",
          "description": "منصة إخبارية عربية ذكية مدعومة بالذكاء الاصطناعي"
        })
      }} />

      <div className="container mx-auto px-4 py-8">
        {/* Top Section - Logo + Description */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link href="/" data-testid="footer-logo">
              <img 
                src={sabqLogo} 
                alt="سبق الذكية" 
                className="h-8 w-auto hover:opacity-80 transition-opacity"
              />
            </Link>
            <p className="text-sm text-muted-foreground text-center md:text-right max-w-md">
              منصة إخبارية عربية ذكية تقدم أخبار عالية الجودة بدعم الذكاء الاصطناعي
            </p>
          </div>

          {/* Social Links - Desktop Only */}
          <div className="hidden md:flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.testId}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                aria-label={social.name}
                data-testid={`footer-social-${social.testId}`}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 text-sm">
          {/* Quick Links */}
          <div className="hidden md:block">
            <h4 className="font-semibold text-foreground mb-3">روابط سريعة</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <span className="text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer" data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="hidden md:block">
            <h4 className="font-semibold text-foreground mb-3">خدمات</h4>
            <ul className="space-y-2">
              {servicesLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <span className="text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer" data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div className="hidden md:block">
            <h4 className="font-semibold text-foreground mb-3">للمطورين</h4>
            <ul className="space-y-2">
              {developersLinks.map((link, index) => (
                <li key={index}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary hover:underline transition-colors"
                      data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href}>
                      <span className="text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer" data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}>
                        {link.label}
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal - Always Visible */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">قانوني</h4>
            <ul className="space-y-2">
              {legalLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <span className="text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer" data-testid={`footer-link-${link.label}`}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section - Mobile Social + Copyright */}
        <div className="flex flex-col items-center gap-4 pt-6 border-t border-border">
          {/* Mobile Social Links */}
          <div className="flex md:hidden items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.testId}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                aria-label={social.name}
                data-testid={`footer-social-${social.testId}-mobile`}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground text-center" data-testid="footer-copyright">
            © {currentYear.toLocaleString('en-US')} سبق الذكية • جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
}
