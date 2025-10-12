import { Link } from "wouter";
import { Mail, Phone, Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const sections = {
    about: [
      { label: "من نحن", href: "#" },
      { label: "اتصل بنا", href: "#" },
      { label: "الشروط والأحكام", href: "#" },
      { label: "سياسة الخصوصية", href: "#" },
    ],
    categories: [
      { label: "سياسة", href: "#" },
      { label: "اقتصاد", href: "#" },
      { label: "رياضة", href: "#" },
      { label: "تقنية", href: "#" },
      { label: "ثقافة وفن", href: "#" },
    ],
    services: [
      { label: "مُقترب", href: "/muqtarib" },
      { label: "جميع التصنيفات", href: "#" },
      { label: "الأخبار", href: "/" },
      { label: "تطبيق الجوال", href: "#" },
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
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link href="/" data-testid="footer-logo">
              <div className="flex items-center gap-3 mb-4 group cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl transition-transform group-hover:scale-105">
                  س
                </div>
                <div>
                  <h3 className="text-xl font-bold">سبق الذكية</h3>
                  <p className="text-xs text-muted-foreground">منصة الأخبار الذكية</p>
                </div>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              منصة إخبارية عربية ذكية تقدم أحدث الأخبار والتحليلات المدعومة بالذكاء الاصطناعي. 
              نسعى لتقديم تجربة إخبارية فريدة ومخصصة لكل قارئ.
            </p>
            <div className="space-y-2">
              <a 
                href="mailto:info@sabq.sa" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-email"
              >
                <Mail className="h-4 w-4" />
                info@sabq.sa
              </a>
              <a 
                href="tel:+966123456789" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-phone"
              >
                <Phone className="h-4 w-4" />
                966123456789+
              </a>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h4 className="font-semibold mb-4">عن الموقع</h4>
            <ul className="space-y-2">
              {sections.about.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
            <h4 className="font-semibold mb-4">الأقسام</h4>
            <ul className="space-y-2">
              {sections.categories.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
            <h4 className="font-semibold mb-4">الخدمات</h4>
            <ul className="space-y-2">
              {sections.services.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`footer-service-${item.href.replace('/', '').replace('#', 'app')}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p data-testid="footer-copyright">
              © {currentYear} سبق الذكية. جميع الحقوق محفوظة.
            </p>
          </div>

          {/* Social Media */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">تابعنا:</span>
            <div className="flex items-center gap-3">
              {socialMedia.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg bg-muted hover-elevate active-elevate-2 transition-colors ${social.color}`}
                  aria-label={social.name}
                  data-testid={`footer-social-${social.name.toLowerCase()}`}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
