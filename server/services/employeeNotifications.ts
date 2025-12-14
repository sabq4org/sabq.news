import { sendEmailNotification } from './email';
import { db } from '../db';
import { employeeEmailTemplates } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const LOGO_PLACEHOLDER = '🧠 سبق';

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
      body { font-family: 'Tajawal', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; direction: rtl; }
      .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 40px 20px; text-align: center; }
      .header h1 { color: white; font-size: 28px; margin: 0; font-weight: bold; }
      .content { padding: 40px 30px; text-align: right; }
      .content h2 { color: #333; font-size: 22px; margin-bottom: 16px; }
      .content p { color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 16px; }
      .highlight-box { background: #e8f4fd; border-right: 4px solid #0066cc; padding: 16px; margin: 20px 0; border-radius: 8px; }
      .credentials { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #eee; }
      .credentials p { margin: 8px 0; font-size: 15px; }
      .credentials strong { color: #0066cc; }
      .button { display: inline-block; background: #0066cc; color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 20px 0; }
      .footer { background: #f9f9f9; padding: 24px 30px; text-align: center; color: #999; font-size: 14px; border-top: 1px solid #eee; }
      .success { color: #28a745; }
      .warning { color: #dc3545; }
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
          <div class="container">
            <div class="header">
              <h1>${LOGO_PLACEHOLDER}</h1>
            </div>
            <div class="content">
              <h2 class="success">🎉 تهانينا {{arabicName}}!</h2>
              <p>يسعدنا إبلاغك بأنه قد تمت الموافقة على طلبك للانضمام إلى فريق المراسلين في صحيفة سبق الإلكترونية.</p>
              
              <div class="highlight-box">
                <p><strong>مرحباً بك في عائلة سبق!</strong></p>
                <p>نحن سعداء بانضمامك إلينا ونتطلع لتعاون مثمر معك.</p>
              </div>
              
              <p>يمكنك الآن تسجيل الدخول باستخدام بيانات الحساب التالية:</p>
              
              <div class="credentials">
                <p><strong>البريد الإلكتروني:</strong> {{email}}</p>
                <p><strong>كلمة المرور المؤقتة:</strong> {{temporaryPassword}}</p>
              </div>
              
              <p style="color: #dc3545; font-size: 14px;">⚠️ يرجى تغيير كلمة المرور فور تسجيل الدخول الأول للحفاظ على أمان حسابك.</p>
              
              <p style="text-align: center;">
                <a href="{{loginUrl}}" class="button">تسجيل الدخول الآن</a>
              </p>
              
              <p>إذا واجهت أي مشكلة، لا تتردد في التواصل معنا.</p>
              
              <p>مع أطيب التحيات،<br><strong>فريق سبق</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية - جميع الحقوق محفوظة</p>
              <p style="font-size: 12px; margin-top: 8px;">هذه الرسالة موجهة للمستلم المحدد فقط</p>
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
          <div class="container">
            <div class="header">
              <h1>${LOGO_PLACEHOLDER}</h1>
            </div>
            <div class="content">
              <h2>{{arabicName}} العزيز/ة</h2>
              <p>شكراً لاهتمامك بالانضمام إلى فريق المراسلين في صحيفة سبق الإلكترونية.</p>
              
              <p>بعد مراجعة طلبك بعناية، نأسف لإبلاغك بأننا لم نتمكن من قبول طلبك في هذا الوقت.</p>
              
              <div class="highlight-box">
                <p><strong>سبب القرار:</strong></p>
                <p>{{reason}}</p>
              </div>
              
              <p>نقدر وقتك وجهدك في التقديم، ونشجعك على إعادة التقديم مستقبلاً بعد استيفاء المتطلبات اللازمة.</p>
              
              <p>نتمنى لك التوفيق في مسيرتك المهنية.</p>
              
              <p>مع أطيب التحيات،<br><strong>فريق سبق</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية - جميع الحقوق محفوظة</p>
            </div>
          </div>
        </body>
        </html>
      `,
      bodyText: `
{{arabicName}} العزيز/ة،

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
          <div class="container">
            <div class="header">
              <h1>${LOGO_PLACEHOLDER}</h1>
            </div>
            <div class="content">
              <h2 class="success">✨ أخبار رائعة {{authorName}}!</h2>
              <p>يسعدنا إبلاغك بأن مقالتك قد تم نشرها بنجاح!</p>
              
              <div class="highlight-box">
                <p><strong>عنوان المقالة:</strong></p>
                <p style="font-size: 18px; color: #333;">{{articleTitle}}</p>
              </div>
              
              <p style="text-align: center;">
                <a href="{{articleUrl}}" class="button">عرض المقالة</a>
              </p>
              
              <p>شكراً لمساهمتك القيمة في إثراء محتوى سبق.</p>
              
              <p>مع أطيب التحيات،<br><strong>فريق سبق</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية - جميع الحقوق محفوظة</p>
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
          <div class="container">
            <div class="header">
              <h1>${LOGO_PLACEHOLDER}</h1>
            </div>
            <div class="content">
              <h2>{{authorName}} العزيز/ة</h2>
              <p>شكراً لتقديم مقالتك إلى صحيفة سبق.</p>
              
              <div class="highlight-box">
                <p><strong>عنوان المقالة:</strong></p>
                <p>{{articleTitle}}</p>
              </div>
              
              <p>بعد مراجعة المقالة من قبل فريق التحرير، نأسف لإبلاغك بأن المقالة لم تستوف معايير النشر المطلوبة.</p>
              
              <div class="credentials">
                <p><strong>ملاحظات فريق التحرير:</strong></p>
                <p>{{reason}}</p>
              </div>
              
              <p>نشجعك على مراجعة الملاحظات وإعادة تقديم المقالة بعد إجراء التعديلات اللازمة.</p>
              
              <p>مع أطيب التحيات،<br><strong>فريق سبق</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية - جميع الحقوق محفوظة</p>
            </div>
          </div>
        </body>
        </html>
      `,
      bodyText: `
{{authorName}} العزيز/ة،

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
          <div class="container">
            <div class="header">
              <h1>${LOGO_PLACEHOLDER}</h1>
            </div>
            <div class="content">
              <h2>مرحباً {{name}} 💪</h2>
              
              <div class="highlight-box">
                <p style="font-size: 18px; line-height: 2;">{{message}}</p>
              </div>
              
              <p>نقدر جهودك ومساهماتك في تقديم أفضل المحتوى لقرائنا.</p>
              
              <p>مع أطيب التحيات،<br><strong>فريق سبق</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية - جميع الحقوق محفوظة</p>
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
