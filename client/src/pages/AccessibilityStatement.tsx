import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Mail, 
  Calendar, 
  Eye, 
  Keyboard, 
  Mouse, 
  Volume2,
  FileText,
  Shield
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AccessibilityStatement() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const lastUpdated = new Date('2025-11-18').toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            بيان إمكانية الوصول
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="text-page-subtitle">
            التزامنا بجعل صبق متاحاً للجميع
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm text-muted-foreground" aria-label={`آخر تحديث: ${lastUpdated}`}>
              آخر تحديث: {lastUpdated}
            </span>
          </div>
        </div>

        {/* Compliance Level */}
        <Card className="mb-6" data-testid="card-compliance-level">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
                  مستوى الامتثال
                </CardTitle>
                <CardDescription>
                  نلتزم بأعلى معايير الوصول الرقمي
                </CardDescription>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2" data-testid="badge-wcag-level">
                WCAG 2.1 AA
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              منصة صبق سمارت متوافقة مع <strong>إرشادات الوصول إلى محتوى الويب (WCAG) 2.1</strong> 
              على مستوى AA. هذا يعني أن الموقع يلبي معايير الوصول المعترف بها عالمياً 
              لضمان إمكانية استخدامه من قبل جميع الأشخاص، بما في ذلك ذوي الإعاقة.
            </p>
          </CardContent>
        </Card>

        {/* Accessibility Features */}
        <Card className="mb-6" data-testid="card-features">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
              الميزات المتاحة
            </CardTitle>
            <CardDescription>
              تم تصميم المنصة لتكون سهلة الاستخدام للجميع
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Visual Features */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                  الوصول البصري
                </h3>
                <ul className="space-y-2 text-foreground" role="list">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>إمكانية تكبير حجم الخط (عادي، كبير، كبير جداً)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>وضع التباين العالي لتسهيل القراءة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>تصميم متجاوب يعمل على جميع الأجهزة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>نسبة تباين ألوان تلبي معايير WCAG AA</span>
                  </li>
                </ul>
              </div>

              {/* Keyboard Navigation */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-primary" aria-hidden="true" />
                  التنقل بلوحة المفاتيح
                </h3>
                <ul className="space-y-2 text-foreground" role="list">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>جميع الوظائف متاحة عبر لوحة المفاتيح فقط</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>مؤشرات تركيز واضحة ومرئية</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>روابط تخطي للوصول السريع إلى المحتوى الرئيسي</span>
                  </li>
                </ul>
              </div>

              {/* Touch Accessibility */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Mouse className="w-4 h-4 text-primary" aria-hidden="true" />
                  الوصول عبر اللمس
                </h3>
                <ul className="space-y-2 text-foreground" role="list">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>أزرار وعناصر تفاعلية بحجم لا يقل عن 44×44 بكسل على الأجهزة المحمولة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>تباعد كافٍ بين العناصر لمنع الضغط الخاطئ</span>
                  </li>
                </ul>
              </div>

              {/* Screen Reader Support */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
                  دعم قارئات الشاشة
                </h3>
                <ul className="space-y-2 text-foreground" role="list">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>توافق كامل مع NVDA، JAWS، VoiceOver، وTalkBack</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>إعلانات حيّة (ARIA Live Regions) للتحديثات الديناميكية</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>تسميات وصفية شاملة باللغة العربية</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>مساعد صوتي مدمج يدعم اللغة العربية</span>
                  </li>
                </ul>
              </div>

              {/* Motion & Animation */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" aria-hidden="true" />
                  الحركة والرسوم المتحركة
                </h3>
                <ul className="space-y-2 text-foreground" role="list">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>خيار تقليل الحركة للمستخدمين الذين يعانون من حساسية للحركة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                    <span>عدم وجود محتوى وامض قد يسبب نوبات</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing & Compliance */}
        <Card className="mb-6" data-testid="card-testing">
          <CardHeader>
            <CardTitle>الاختبار والامتثال</CardTitle>
            <CardDescription>
              نلتزم باختبار المنصة بشكل مستمر
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-foreground">
              <p className="leading-relaxed">
                يتم اختبار منصة صبق سمارت بشكل دوري باستخدام:
              </p>
              <ul className="space-y-2 mr-6" role="list">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                  <span>أدوات اختبار آلية (axe-core، WAVE، Lighthouse)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                  <span>اختبار يدوي مع قارئات الشاشة المختلفة</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                  <span>اختبار التنقل بلوحة المفاتيح</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                  <span>اختبار التوافق مع الأجهزة المساعدة</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Feedback */}
        <Card data-testid="card-contact">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
              تواصل معنا
            </CardTitle>
            <CardDescription>
              نحن نرحب بملاحظاتك واقتراحاتك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-foreground leading-relaxed">
                نسعى باستمرار لتحسين إمكانية الوصول على منصة صبق. إذا واجهت أي صعوبات في 
                استخدام الموقع أو لديك اقتراحات لتحسين تجربة الوصول، يرجى التواصل معنا:
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span className="font-medium">البريد الإلكتروني:</span>
                </div>
                <a 
                  href="mailto:accessibility@sabq.life" 
                  className="text-primary hover:underline block mr-6"
                  data-testid="link-email-contact"
                >
                  accessibility@sabq.life
                </a>
              </div>

              <p className="text-sm text-muted-foreground">
                سنرد على استفساراتك في أقرب وقت ممكن، عادةً خلال 2-3 أيام عمل.
              </p>

              <Button 
                variant="default" 
                className="w-full sm:w-auto"
                asChild
                data-testid="button-send-feedback"
              >
                <a href="mailto:accessibility@sabq.life">
                  <Mail className="w-4 h-4 ml-2" aria-hidden="true" />
                  إرسال ملاحظات حول إمكانية الوصول
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Known Issues */}
        <Card className="mb-6" data-testid="card-known-issues">
          <CardHeader>
            <CardTitle>المشكلات المعروفة والتحسينات المستقبلية</CardTitle>
            <CardDescription>
              نعمل باستمرار على تحسين تجربة الوصول
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed mb-3">
              نحن ملتزمون بتحسين تجربة الوصول بشكل مستمر. حالياً نعمل على:
            </p>
            <ul className="space-y-2 text-foreground" role="list">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>توسيع دعم المساعد الصوتي ليشمل لهجات عربية إضافية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>إضافة نصوص بديلة (alt text) ذكية للصور باستخدام الذكاء الاصطناعي</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>تحسين وضع القراءة للمستخدمين ذوي صعوبات التعلم</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            بيان إمكانية الوصول هذا ينطبق على منصة صبق سمارت (sabq.life)
          </p>
          <p className="mt-2">
            آخر مراجعة: {lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
}
