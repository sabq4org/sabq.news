import { sendEmailNotification } from './email';
import { db } from '../db';
import { employeeEmailTemplates } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const LOGO_PATH = '/branding/sabq-logo.png';
const BRAND_COLOR = '#1a73e8';
const BRAND_DARK = '#0d47a1';

function getFrontendUrl(): string {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    const primaryDomain = domains[0]?.trim();
    if (primaryDomain) {
      return `https://${primaryDomain}`;
    }
  }
  return 'http://localhost:5000';
}

function getLogoUrl(): string {
  return `${getFrontendUrl()}${LOGO_PATH}`;
}

type TemplateType = 'correspondent_approved' | 'correspondent_rejected' | 'article_published' | 'article_rejected' | 'motivational';

interface TemplateData {
  [key: string]: string | undefined;
}

async function getTemplate(type: TemplateType): Promise<{ subject: string; bodyHtml: string; bodyText: string } | null> {
  try {
    const [template] = await db
      .select()
      .from(employeeEmailTemplates)
      .where(and(eq(employeeEmailTemplates.type, type), eq(employeeEmailTemplates.isActive, true)))
      .limit(1);
    
    if (template) {
      return {
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
      };
    }
    return null;
  } catch (error) {
    console.warn(`Failed to fetch template ${type} from database:`, error);
    return null;
  }
}

function replacePlaceholders(template: string, data: TemplateData): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

function getDefaultTemplate(type: TemplateType): { subject: string; bodyHtml: string; bodyText: string } {
  const baseStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
      
      body { 
        font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
        background-color: #f0f4f8; 
        margin: 0; 
        padding: 0; 
        direction: rtl;
        -webkit-font-smoothing: antialiased;
      }
      
      .wrapper {
        padding: 40px 20px;
      }
      
      .container { 
        max-width: 580px; 
        margin: 0 auto; 
        background: #ffffff; 
        border-radius: 16px; 
        overflow: hidden; 
        box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      }
      
      .header { 
        background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); 
        padding: 32px 24px; 
        text-align: center;
      }
      
      .header img {
        height: 48px;
        margin-bottom: 8px;
      }
      
      .header-text {
        color: rgba(255,255,255,0.95);
        font-size: 20px;
        font-weight: 500;
        margin: 0;
        letter-spacing: -0.3px;
      }
      
      .content { 
        padding: 36px 32px; 
        text-align: right;
      }
      
      .greeting {
        color: #1a1a2e;
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 20px 0;
        line-height: 1.4;
      }
      
      .content p { 
        color: #4a5568; 
        font-size: 16px; 
        line-height: 1.9; 
        margin: 0 0 18px 0;
      }
      
      .info-card { 
        background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
        border-right: 4px solid ${BRAND_COLOR}; 
        padding: 20px 24px; 
        margin: 24px 0; 
        border-radius: 12px;
      }
      
      .info-card-label {
        color: #64748b;
        font-size: 13px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 8px 0;
      }
      
      .info-card-content {
        color: #1e293b;
        font-size: 16px;
        line-height: 1.7;
        margin: 0;
      }
      
      .credentials-box { 
        background: #fafbfc;
        padding: 24px; 
        margin: 24px 0; 
        border-radius: 12px; 
        border: 1px solid #e2e8f0;
      }
      
      .credentials-box p { 
        margin: 10px 0; 
        font-size: 15px;
        color: #475569;
      }
      
      .credentials-box strong { 
        color: ${BRAND_COLOR};
        font-weight: 600;
      }
      
      .btn { 
        display: inline-block; 
        background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%);
        color: #ffffff !important; 
        text-decoration: none; 
        padding: 14px 36px; 
        border-radius: 10px; 
        font-size: 16px; 
        font-weight: 600; 
        margin: 24px 0;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 14px rgba(26, 115, 232, 0.35);
      }
      
      .signature {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
      }
      
      .signature p {
        color: #64748b;
        margin: 0;
      }
      
      .signature strong {
        color: #1e293b;
      }
      
      .footer { 
        background: #f8fafc; 
        padding: 24px 32px; 
        text-align: center; 
        border-top: 1px solid #e2e8f0;
      }
      
      .footer p {
        color: #94a3b8;
        font-size: 13px;
        margin: 4px 0;
      }
      
      .divider {
        height: 1px;
        background: #e2e8f0;
        margin: 24px 0;
      }
      
      .badge-success {
        display: inline-block;
        background: #dcfce7;
        color: #166534;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .badge-warning {
        display: inline-block;
        background: #fef3c7;
        color: #92400e;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .text-muted {
        color: #94a3b8 !important;
        font-size: 14px !important;
      }
    </style>
  `;

  const templates: Record<TemplateType, { subject: string; bodyHtml: string; bodyText: string }> = {
    correspondent_approved: {
      subject: '🎉 تهانينا! تمت الموافقة على طلبك للانضمام إلى فريق سبق',
      bodyHtml: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <img src="${getLogoUrl()}" alt="سبق" onerror="this.style.display='none'" />
                <p class="header-text">صحيفة سبق الإلكترونية</p>
              </div>
              
              <div class="content">
                <h2 class="greeting">مرحباً {{arabicName}}!</h2>
                
                <div style="text-align: center; margin-bottom: 24px;">
                  <span class="badge-success">تمت الموافقة على طلبك</span>
                </div>
                
                <p>يسعدنا إبلاغك بأنه قد تمت الموافقة على طلبك للانضمام إلى فريق المراسلين في صحيفة سبق الإلكترونية.</p>
                
                <div class="info-card">
                  <p class="info-card-label">مرحباً بك في عائلة سبق!</p>
                  <p class="info-card-content">نحن سعداء بانضمامك إلينا ونتطلع لتعاون مثمر معك.</p>
                </div>
                
                <p>يمكنك الآن تسجيل الدخول باستخدام البيانات التالية:</p>
                
                <div class="credentials-box">
                  <p><strong>البريد الإلكتروني:</strong> {{email}}</p>
                  <p><strong>كلمة المرور المؤقتة:</strong> {{temporaryPassword}}</p>
                </div>
                
                <p class="text-muted">يرجى تغيير كلمة المرور فور تسجيل الدخول الأول للحفاظ على أمان حسابك.</p>
                
                <p style="text-align: center;">
                  <a href="{{loginUrl}}" class="btn">تسجيل الدخول الآن</a>
                </p>
                
                <div class="signature">
                  <p>مع أطيب التحيات،</p>
                  <p><strong>فريق سبق</strong></p>
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية</p>
                <p>جميع الحقوق محفوظة</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      bodyText: `
تهانينا {{arabicName}}!

يسعدنا إبلاغك بأنه قد تمت الموافقة على طلبك للانضمام إلى فريق المراسلين في صحيفة سبق الإلكترونية.

مرحباً بك في عائلة سبق! نحن سعداء بانضمامك إلينا ونتطلع لتعاون مثمر معك.

بيانات تسجيل الدخول:
- البريد الإلكتروني: {{email}}
- كلمة المرور المؤقتة: {{temporaryPassword}}

⚠️ يرجى تغيير كلمة المرور فور تسجيل الدخول الأول للحفاظ على أمان حسابك.

مع أطيب التحيات،
فريق سبق
      `.trim(),
    },
    correspondent_rejected: {
      subject: 'بخصوص طلبك للانضمام إلى فريق سبق',
      bodyHtml: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <img src="${getLogoUrl()}" alt="سبق" onerror="this.style.display='none'" />
                <p class="header-text">صحيفة سبق الإلكترونية</p>
              </div>
              
              <div class="content">
                <h2 class="greeting">العزيز/ة {{arabicName}}،</h2>
                
                <p>نشكرك على اهتمامك بالانضمام إلى فريق المراسلين في صحيفة سبق الإلكترونية.</p>
                
                <p>بعد مراجعة طلبك بعناية من قبل لجنة التقييم، نود إبلاغك بأننا لم نتمكن من قبول طلبك في الوقت الحالي.</p>
                
                <div class="info-card">
                  <p class="info-card-label">ملاحظات اللجنة</p>
                  <p class="info-card-content">{{reason}}</p>
                </div>
                
                <p>نقدّر الوقت والجهد الذي بذلته في التقديم، ونشجعك على متابعة تطوير مهاراتك وإعادة التقديم مستقبلاً.</p>
                
                <p>نتمنى لك كل التوفيق في مسيرتك المهنية.</p>
                
                <div class="signature">
                  <p>مع أطيب التحيات،</p>
                  <p><strong>فريق التوظيف - سبق</strong></p>
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية</p>
                <p>جميع الحقوق محفوظة</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      bodyText: `
العزيز/ة {{arabicName}}،

شكراً لاهتمامك بالانضمام إلى فريق المراسلين في صحيفة سبق الإلكترونية.

بعد مراجعة طلبك بعناية، نأسف لإبلاغك بأننا لم نتمكن من قبول طلبك في هذا الوقت.

سبب القرار: {{reason}}

نقدر وقتك وجهدك في التقديم، ونشجعك على إعادة التقديم مستقبلاً بعد استيفاء المتطلبات اللازمة.

نتمنى لك التوفيق في مسيرتك المهنية.

مع أطيب التحيات،
فريق سبق
      `.trim(),
    },
    article_published: {
      subject: '✨ تهانينا! تم نشر مقالتك',
      bodyHtml: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <img src="${getLogoUrl()}" alt="سبق" onerror="this.style.display='none'" />
                <p class="header-text">صحيفة سبق الإلكترونية</p>
              </div>
              
              <div class="content">
                <h2 class="greeting">أخبار رائعة {{authorName}}!</h2>
                
                <div style="text-align: center; margin-bottom: 24px;">
                  <span class="badge-success">تم نشر مقالتك بنجاح</span>
                </div>
                
                <p>يسعدنا إبلاغك بأن مقالتك قد تم نشرها بنجاح!</p>
                
                <div class="info-card">
                  <p class="info-card-label">عنوان المقالة</p>
                  <p class="info-card-content">{{articleTitle}}</p>
                </div>
                
                <p style="text-align: center;">
                  <a href="{{articleUrl}}" class="btn">عرض المقالة</a>
                </p>
                
                <p>شكراً لمساهمتك القيمة في إثراء محتوى سبق.</p>
                
                <div class="signature">
                  <p>مع أطيب التحيات،</p>
                  <p><strong>فريق سبق</strong></p>
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية</p>
                <p>جميع الحقوق محفوظة</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      bodyText: `
أخبار رائعة {{authorName}}!

يسعدنا إبلاغك بأن مقالتك قد تم نشرها بنجاح!

عنوان المقالة: {{articleTitle}}

رابط المقالة: {{articleUrl}}

شكراً لمساهمتك القيمة في إثراء محتوى سبق.

مع أطيب التحيات،
فريق سبق
      `.trim(),
    },
    article_rejected: {
      subject: 'بخصوص مقالتك المقدمة',
      bodyHtml: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <img src="${getLogoUrl()}" alt="سبق" onerror="this.style.display='none'" />
                <p class="header-text">صحيفة سبق الإلكترونية</p>
              </div>
              
              <div class="content">
                <h2 class="greeting">العزيز/ة {{authorName}}،</h2>
                
                <p>شكراً لتقديم مقالتك إلى صحيفة سبق.</p>
                
                <div class="info-card">
                  <p class="info-card-label">عنوان المقالة</p>
                  <p class="info-card-content">{{articleTitle}}</p>
                </div>
                
                <p>بعد مراجعة المقالة من قبل فريق التحرير، نأسف لإبلاغك بأن المقالة لم تستوف معايير النشر المطلوبة.</p>
                
                <div class="credentials-box">
                  <p><strong>ملاحظات فريق التحرير:</strong></p>
                  <p>{{reason}}</p>
                </div>
                
                <p>نشجعك على مراجعة الملاحظات وإعادة تقديم المقالة بعد إجراء التعديلات اللازمة.</p>
                
                <div class="signature">
                  <p>مع أطيب التحيات،</p>
                  <p><strong>فريق التحرير - سبق</strong></p>
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية</p>
                <p>جميع الحقوق محفوظة</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      bodyText: `
العزيز/ة {{authorName}}،

شكراً لتقديم مقالتك إلى صحيفة سبق.

عنوان المقالة: {{articleTitle}}

بعد مراجعة المقالة من قبل فريق التحرير، نأسف لإبلاغك بأن المقالة لم تستوف معايير النشر المطلوبة.

ملاحظات فريق التحرير:
{{reason}}

نشجعك على مراجعة الملاحظات وإعادة تقديم المقالة بعد إجراء التعديلات اللازمة.

مع أطيب التحيات،
فريق سبق
      `.trim(),
    },
    motivational: {
      subject: '💪 رسالة تحفيزية من فريق سبق',
      bodyHtml: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <img src="${getLogoUrl()}" alt="سبق" onerror="this.style.display='none'" />
                <p class="header-text">صحيفة سبق الإلكترونية</p>
              </div>
              
              <div class="content">
                <h2 class="greeting">مرحباً {{name}}!</h2>
                
                <div class="info-card">
                  <p class="info-card-label">رسالة خاصة لك</p>
                  <p class="info-card-content">{{message}}</p>
                </div>
                
                <p>نقدر جهودك ومساهماتك في تقديم أفضل المحتوى لقرائنا.</p>
                
                <div class="signature">
                  <p>مع أطيب التحيات،</p>
                  <p><strong>فريق سبق</strong></p>
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية</p>
                <p>جميع الحقوق محفوظة</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      bodyText: `
مرحباً {{name}}،

{{message}}

نقدر جهودك ومساهماتك في تقديم أفضل المحتوى لقرائنا.

مع أطيب التحيات،
فريق سبق
      `.trim(),
    },
  };

  return templates[type];
}

const TEMPLATE_NAMES: Record<TemplateType, string> = {
  correspondent_approved: "قبول طلب المراسل",
  correspondent_rejected: "رفض طلب المراسل",
  article_published: "نشر المقال",
  article_rejected: "رفض المقال",
  motivational: "رسالة تحفيزية",
};

export function getAllDefaultTemplates(): Array<{
  type: TemplateType;
  nameAr: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  isActive: boolean;
}> {
  const types: TemplateType[] = ['correspondent_approved', 'correspondent_rejected', 'article_published', 'article_rejected', 'motivational'];
  
  return types.map(type => {
    const template = getDefaultTemplate(type);
    return {
      type,
      nameAr: TEMPLATE_NAMES[type],
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText,
      isActive: true,
    };
  });
}

export function getDefaultTemplateByType(type: TemplateType): {
  type: TemplateType;
  nameAr: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  isActive: boolean;
} | null {
  const validTypes: TemplateType[] = ['correspondent_approved', 'correspondent_rejected', 'article_published', 'article_rejected', 'motivational'];
  if (!validTypes.includes(type)) return null;
  
  const template = getDefaultTemplate(type);
  return {
    type,
    nameAr: TEMPLATE_NAMES[type],
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    bodyText: template.bodyText,
    isActive: true,
  };
}

export async function sendCorrespondentApprovalEmail(
  email: string,
  arabicName: string,
  englishName: string,
  temporaryPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const customTemplate = await getTemplate('correspondent_approved');
    const template = customTemplate || getDefaultTemplate('correspondent_approved');
    
    const frontendUrl = getFrontendUrl();
    const data: TemplateData = {
      arabicName,
      englishName,
      email,
      temporaryPassword,
      loginUrl: `${frontendUrl}/login`,
    };
    
    const subject = replacePlaceholders(template.subject, data);
    const html = replacePlaceholders(template.bodyHtml, data);
    const text = replacePlaceholders(template.bodyText, data);
    
    console.log(`📧 Sending correspondent approval email to: ${email}`);
    
    const result = await sendEmailNotification({
      to: email,
      subject,
      html,
      text,
    });
    
    if (result.success) {
      console.log(`✅ Correspondent approval email sent successfully to: ${email}`);
    } else {
      console.error(`❌ Failed to send correspondent approval email to: ${email}`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending correspondent approval email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

export async function sendCorrespondentRejectionEmail(
  email: string,
  arabicName: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const customTemplate = await getTemplate('correspondent_rejected');
    const template = customTemplate || getDefaultTemplate('correspondent_rejected');
    
    const data: TemplateData = {
      arabicName,
      reason,
    };
    
    const subject = replacePlaceholders(template.subject, data);
    const html = replacePlaceholders(template.bodyHtml, data);
    const text = replacePlaceholders(template.bodyText, data);
    
    console.log(`📧 Sending correspondent rejection email to: ${email}`);
    
    const result = await sendEmailNotification({
      to: email,
      subject,
      html,
      text,
    });
    
    if (result.success) {
      console.log(`✅ Correspondent rejection email sent successfully to: ${email}`);
    } else {
      console.error(`❌ Failed to send correspondent rejection email to: ${email}`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending correspondent rejection email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

export async function sendArticlePublishedEmail(
  email: string,
  authorName: string,
  articleTitle: string,
  articleUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const customTemplate = await getTemplate('article_published');
    const template = customTemplate || getDefaultTemplate('article_published');
    
    const data: TemplateData = {
      authorName,
      articleTitle,
      articleUrl,
    };
    
    const subject = replacePlaceholders(template.subject, data);
    const html = replacePlaceholders(template.bodyHtml, data);
    const text = replacePlaceholders(template.bodyText, data);
    
    console.log(`📧 Sending article published email to: ${email}`);
    
    const result = await sendEmailNotification({
      to: email,
      subject,
      html,
      text,
    });
    
    if (result.success) {
      console.log(`✅ Article published email sent successfully to: ${email}`);
    } else {
      console.error(`❌ Failed to send article published email to: ${email}`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending article published email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

export async function sendArticleRejectedEmail(
  email: string,
  authorName: string,
  articleTitle: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const customTemplate = await getTemplate('article_rejected');
    const template = customTemplate || getDefaultTemplate('article_rejected');
    
    const data: TemplateData = {
      authorName,
      articleTitle,
      reason,
    };
    
    const subject = replacePlaceholders(template.subject, data);
    const html = replacePlaceholders(template.bodyHtml, data);
    const text = replacePlaceholders(template.bodyText, data);
    
    console.log(`📧 Sending article rejected email to: ${email}`);
    
    const result = await sendEmailNotification({
      to: email,
      subject,
      html,
      text,
    });
    
    if (result.success) {
      console.log(`✅ Article rejected email sent successfully to: ${email}`);
    } else {
      console.error(`❌ Failed to send article rejected email to: ${email}`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending article rejected email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

export async function sendMotivationalEmail(
  email: string,
  name: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const customTemplate = await getTemplate('motivational');
    const template = customTemplate || getDefaultTemplate('motivational');
    
    const data: TemplateData = {
      name,
      message,
    };
    
    const subject = replacePlaceholders(template.subject, data);
    const html = replacePlaceholders(template.bodyHtml, data);
    const text = replacePlaceholders(template.bodyText, data);
    
    console.log(`📧 Sending motivational email to: ${email}`);
    
    const result = await sendEmailNotification({
      to: email,
      subject,
      html,
      text,
    });
    
    if (result.success) {
      console.log(`✅ Motivational email sent successfully to: ${email}`);
    } else {
      console.error(`❌ Failed to send motivational email to: ${email}`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending motivational email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
