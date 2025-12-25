# تحليل الأداء - sabq.news

## تاريخ التحليل: 25 ديسمبر 2025

## قياسات زمن الاستجابة

### الصفحة الرئيسية (https://sabq.news)

| المقياس | القيمة | التقييم |
|---------|--------|---------|
| DNS Lookup | 0.001s | ممتاز |
| TCP Connect | 0.001s | ممتاز |
| TLS Handshake | 0.074s | جيد |
| Time to First Byte (TTFB) | 0.355s | جيد |
| Total Time | 0.355s | جيد |
| Download Size | 2,363 bytes | خفيف |
| HTTP Status | 200 | نجاح |

### API المقالات (/api/articles?limit=10)

| المقياس | القيمة | التقييم |
|---------|--------|---------|
| Time to First Byte (TTFB) | 0.458s | مقبول |
| Total Time | 0.459s | مقبول |
| Download Size | 61,118 bytes | متوسط |
| HTTP Status | 200 | نجاح |

### نقطة الصحة (/health)

| المقياس | القيمة | التقييم |
|---------|--------|---------|
| Time to First Byte (TTFB) | 0.322s | جيد |
| Total Time | 0.322s | جيد |
| HTTP Status | 200 | نجاح |
| Database Status | configured | متصل |
| Environment | production | إنتاج |

### اختبار التحميل المتعدد (5 طلبات متتالية)

| الطلب | TTFB | Total Time |
|-------|------|------------|
| 1 | 0.331s | 0.331s |
| 2 | 0.336s | 0.336s |
| 3 | 0.341s | 0.341s |
| 4 | 0.345s | 0.345s |
| 5 | 0.300s | 0.300s |
| **المتوسط** | **0.331s** | **0.331s** |

## رؤوس HTTP الأمنية

| الرأس | القيمة | التقييم |
|-------|--------|---------|
| Content-Security-Policy | مُعدّ بشكل شامل | ممتاز |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | ممتاز |
| X-Content-Type-Options | nosniff | ممتاز |
| X-Frame-Options | SAMEORIGIN | ممتاز |
| X-XSS-Protection | 0 (معطل - الاعتماد على CSP) | جيد |
| Referrer-Policy | strict-origin-when-cross-origin | ممتاز |
| Cross-Origin-Opener-Policy | same-origin | ممتاز |
| Cross-Origin-Resource-Policy | cross-origin | جيد |

## شهادة SSL

| المعلومة | القيمة |
|----------|--------|
| المُصدر | Google Trust Services (WE1) |
| تاريخ البدء | 24 ديسمبر 2025 |
| تاريخ الانتهاء | 24 مارس 2026 |
| الموضوع | sabq.news |
| الحالة | صالحة |

## البنية التحتية

| المكون | القيمة |
|--------|--------|
| CDN | Cloudflare |
| HTTP Version | HTTP/2 |
| Proxy | Google (via: 1.1 google) |
| Cache Status | DYNAMIC |
| Server | cloudflare |

## ملخص الأداء

يُظهر الموقع أداءً جيداً بشكل عام مع متوسط زمن استجابة يبلغ حوالي 330 مللي ثانية للصفحة الرئيسية. استخدام Cloudflare كـ CDN يوفر حماية إضافية وتسريع للمحتوى. رؤوس الأمان HTTP مُعدّة بشكل ممتاز مع CSP شامل و HSTS مُفعّل.
