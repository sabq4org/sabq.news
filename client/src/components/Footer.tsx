import { Link } from "wouter";
import { useState } from "react";
import { 
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Send,
  ArrowUp,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import sabqLogo from "@assets/sabq-logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          language: 'ar',
          source: 'footer',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "خطأ",
          description: data.message || "فشل في الاشتراك في النشرة البريدية",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "تم الاشتراك بنجاح!",
        description: "شكراً لاشتراكك في النشرة البريدية. سنرسل لك آخر الأخبار والتحديثات",
      });
      setEmail("");
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الاشتراك. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    { label: "لحظة بلحظة", href: "/moment-by-moment" },
  ];

  const developersLinks = [
    { label: "دليل API", href: "/ai-publisher" },
    { label: "OpenAPI Spec", href: "/openapi.json", external: true },
  ];

  const legalLinks = [
    { label: "الخصوصية", href: "/ar/privacy" },
    { label: "الشروط", href: "/ar/terms" },
    { label: "الملفات", href: "/cookies" },
    { label: "إمكانية الوصول", href: "/ar/accessibility-statement" },
  ];

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com", testId: "facebook", color: "hover:text-blue-600" },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com", testId: "twitter", color: "hover:text-sky-500" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com", testId: "instagram", color: "hover:text-pink-600" },
    { name: "Youtube", icon: Youtube, href: "https://youtube.com", testId: "youtube", color: "hover:text-red-600" },
    { name: "Linkedin", icon: Linkedin, href: "https://linkedin.com", testId: "linkedin", color: "hover:text-blue-700" },
  ];

  const contactInfo = [
    { icon: Mail, text: "info@sabq.news", href: "mailto:info@sabq.news", label: "البريد الإلكتروني" },
    { icon: Phone, text: "+966 11 234 5678", href: "tel:+966112345678", label: "الهاتف" },
    { icon: Globe, text: "sabq.news", href: "https://sabq.news", label: "الموقع الإلكتروني" },
  ];

  return (
    <footer 
      id="footer" 
      className="relative bg-gradient-to-b from-footer to-footer/95 border-t border-border/50 backdrop-blur-sm" 
      data-testid="footer" 
      dir="rtl" 
      role="contentinfo" 
      aria-label="ذيل الصفحة" 
      tabIndex={-1}
    >
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          "name": "سبق الذكية",
          "alternateName": "Sabq Smart",
          "url": "https://sabq.news",
          "description": "منصة إخبارية عربية ذكية مدعومة بالذكاء الاصطناعي",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+966-11-234-5678",
            "contactType": "customer service",
            "email": "info@sabq.news",
            "availableLanguage": ["ar", "en", "ur"]
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

      <div className="container mx-auto px-4 py-6 md:py-10 lg:py-12">
        
        {/* Brand Section - Simplified on mobile */}
        <div className="mb-6 md:mb-12">
          <div className="flex flex-col gap-3">
            <Link href="/" data-testid="footer-logo" className="inline-block">
              <img 
                src={sabqLogo} 
                alt="سبق الذكية - منصة إخبارية ذكية" 
                className="h-10 w-auto hover:opacity-80 transition-opacity"
                loading="lazy"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm line-clamp-2 md:line-clamp-none">
              منصة إخبارية عربية ذكية تقدم أخبار عالية الجودة بدعم الذكاء الاصطناعي. نسعى لتقديم محتوى موثوق ومتميز يواكب العصر الرقمي.
            </p>
          </div>
        </div>

        {/* Accordion for mobile only */}
        <div className="md:hidden mb-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="contact">
              <AccordionTrigger className="text-base font-semibold">تواصل معنا</AccordionTrigger>
              <AccordionContent>
                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  {contactInfo.map((contact, index) => (
                    <a
                      key={index}
                      href={contact.href}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                      data-testid={`footer-contact-${index}`}
                      aria-label={contact.label}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <contact.icon className="h-4 w-4 group-hover:text-primary transition-colors" aria-hidden="true" />
                      </div>
                      <span className="group-hover:underline">{contact.text}</span>
                    </a>
                  ))}
                </div>

                {/* Social Links */}
                <div>
                  <h5 className="font-semibold text-foreground text-sm mb-3">تابعنا</h5>
                  <div className="flex items-center gap-2 flex-wrap">
                    {socialLinks.map((social) => (
                      <a
                        key={social.testId}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300 hover:scale-110 ${social.color}`}
                        aria-label={`تابعنا على ${social.name}`}
                        data-testid={`footer-social-${social.testId}`}
                      >
                        <social.icon className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="links">
              <AccordionTrigger className="text-base font-semibold">روابط سريعة</AccordionTrigger>
              <AccordionContent>
                <nav aria-label="روابط سريعة">
                  <ul className="space-y-2.5">
                    {quickLinks.map((link, index) => (
                      <li key={index}>
                        <Link href={link.href}>
                          <span 
                            className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 cursor-pointer inline-block" 
                            data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                          >
                            {link.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="services">
              <AccordionTrigger className="text-base font-semibold">خدماتنا</AccordionTrigger>
              <AccordionContent>
                <nav aria-label="خدماتنا">
                  <ul className="space-y-2.5">
                    {servicesLinks.map((link, index) => (
                      <li key={index}>
                        <Link href={link.href}>
                          <span 
                            className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 cursor-pointer inline-block" 
                            data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                          >
                            {link.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Desktop Grid Layout - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-8 lg:gap-12 mb-6 md:mb-12">
          
          {/* Brand Section - Desktop */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground text-base mb-4">تواصل معنا</h4>
              {contactInfo.map((contact, index) => (
                <a
                  key={index}
                  href={contact.href}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                  data-testid={`footer-contact-${index}`}
                  aria-label={contact.label}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <contact.icon className="h-4 w-4 group-hover:text-primary transition-colors" aria-hidden="true" />
                  </div>
                  <span className="group-hover:underline">{contact.text}</span>
                </a>
              ))}
            </div>

            {/* Social Links */}
            <div>
              <h4 className="font-semibold text-foreground text-base mb-4">تابعنا</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {socialLinks.map((social) => (
                  <a
                    key={social.testId}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300 hover:scale-110 ${social.color}`}
                    aria-label={`تابعنا على ${social.name}`}
                    data-testid={`footer-social-${social.testId}`}
                  >
                    <social.icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-foreground text-base mb-4 after:content-[''] after:block after:w-12 after:h-0.5 after:bg-primary after:mt-2">روابط سريعة</h4>
            <nav aria-label="روابط سريعة">
              <ul className="space-y-2.5">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.href}>
                      <span 
                        className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 cursor-pointer inline-block" 
                        data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Services */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-foreground text-base mb-4 after:content-[''] after:block after:w-12 after:h-0.5 after:bg-primary after:mt-2">خدماتنا</h4>
            <nav aria-label="خدماتنا">
              <ul className="space-y-2.5">
                {servicesLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.href}>
                      <span 
                        className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 cursor-pointer inline-block" 
                        data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Developers */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-foreground text-base mb-4 after:content-[''] after:block after:w-12 after:h-0.5 after:bg-primary after:mt-2">للمطورين</h4>
            <nav aria-label="للمطورين">
              <ul className="space-y-2.5">
                {developersLinks.map((link, index) => (
                  <li key={index}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block"
                        data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>
                        <span 
                          className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 cursor-pointer inline-block" 
                          data-testid={`footer-link-${link.label.replace(/\s+/g, '-')}`}
                        >
                          {link.label}
                        </span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Newsletter Section - Desktop */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-foreground text-base mb-4 after:content-[''] after:block after:w-12 after:h-0.5 after:bg-primary after:mt-2">النشرة البريدية</h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              اشترك في نشرتنا البريدية لتصلك آخر الأخبار والتحديثات
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3" data-testid="newsletter-form">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-3 pl-3 h-11 bg-muted/50 border-border focus:border-primary"
                  disabled={isSubmitting}
                  data-testid="newsletter-email-input"
                  aria-label="البريد الإلكتروني للاشتراك في النشرة البريدية"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 gap-2"
                disabled={isSubmitting}
                data-testid="newsletter-submit-button"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "جاري الإرسال..." : "اشترك الآن"}
              </Button>
            </form>
          </div>
        </div>

        {/* Newsletter Section - Mobile Compact */}
        <div className="md:hidden mb-6">
          <h4 className="font-semibold text-foreground text-base mb-3">النشرة البريدية</h4>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-2" data-testid="newsletter-form">
            <Input
              type="email"
              placeholder="بريدك الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pr-3 pl-3 h-10 bg-muted/50 border-border focus:border-primary flex-1"
              disabled={isSubmitting}
              data-testid="newsletter-email-input"
              aria-label="البريد الإلكتروني للاشتراك في النشرة البريدية"
              required
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              disabled={isSubmitting}
              data-testid="newsletter-submit-button"
              aria-label="اشترك في النشرة البريدية"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 md:pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Legal Links */}
            <nav aria-label="روابط قانونية" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              {legalLinks.map((link, index) => (
                <Link key={index} href={link.href}>
                  <span 
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" 
                    data-testid={`footer-legal-${link.label}`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Copyright */}
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground text-center" data-testid="footer-copyright">
                © {currentYear.toLocaleString('en-US')} سبق الذكية • جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg hover:bg-primary hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        aria-label="العودة إلى الأعلى"
        data-testid="scroll-to-top"
      >
        <ArrowUp className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
      </button>
    </footer>
  );
}
