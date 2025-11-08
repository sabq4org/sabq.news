import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import { db } from '../db';
import { emailVerificationTokens, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@sabq.sa';

// Get frontend URL from environment or detect from Replit domains
function getFrontendUrl(): string {
  // 1. Use explicit FRONTEND_URL if provided
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  // 2. Use REPLIT_DOMAINS if available (production)
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    const primaryDomain = domains[0]?.trim();
    if (primaryDomain) {
      return `https://${primaryDomain}`;
    }
  }
  
  // 3. Fallback to localhost for local development
  return 'http://localhost:5000';
}

const FRONTEND_URL = getFrontendUrl();

if (!SENDGRID_API_KEY) {
  console.warn('⚠️  SENDGRID_API_KEY not set. Email functionality will be disabled.');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid email service initialized');
  console.log(`🔗 Frontend URL for email links: ${FRONTEND_URL}`);
}

/**
 * Generate a random verification token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send email verification to user
 */
export async function sendVerificationEmail(userId: string, email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SENDGRID_API_KEY) {
      return { success: false, error: 'SendGrid API key not configured' };
    }

    // Generate token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

    // Save token to database
    await db.insert(emailVerificationTokens).values({
      userId,
      token,
      expiresAt,
      used: false,
    });

    // Create verification link
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;

    // Email content
    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject: 'تفعيل حسابك في صحيفة سبق - Activate Your Sabq Account',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Tajawal', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; direction: rtl; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; font-size: 28px; margin: 0; font-weight: bold; }
            .content { padding: 40px 30px; text-align: right; }
            .content h2 { color: #333; font-size: 22px; margin-bottom: 16px; }
            .content p { color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 16px; }
            .button { display: inline-block; background: #0066cc; color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 20px 0; transition: background 0.3s; }
            .button:hover { background: #0052a3; }
            .footer { background: #f9f9f9; padding: 24px 30px; text-align: center; color: #999; font-size: 14px; border-top: 1px solid #eee; }
            .divider { border: 0; height: 1px; background: #eee; margin: 24px 0; }
            .en-section { direction: ltr; text-align: left; margin-top: 24px; padding-top: 24px; border-top: 2px solid #eee; }
            .en-section h2 { font-size: 20px; color: #333; margin-bottom: 12px; }
            .en-section p { color: #666; font-size: 15px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧠 صحيفة سبق الإلكترونية</h1>
            </div>
            
            <div class="content">
              <h2>مرحباً بك في سبق!</h2>
              <p>شكراً لتسجيلك في صحيفة سبق الإلكترونية. لتفعيل حسابك والاستمتاع بجميع المزايا، يرجى تأكيد بريدك الإلكتروني.</p>
              
              <p style="text-align: center;">
                <a href="${verificationLink}" class="button" data-testid="verify-button">
                  ✓ تفعيل الحساب
                </a>
              </p>
              
              <p style="color: #999; font-size: 14px;">
                أو انسخ الرابط التالي والصقه في المتصفح:<br>
                <span style="color: #0066cc; word-break: break-all;">${verificationLink}</span>
              </p>
              
              <p style="font-size: 14px; color: #999; margin-top: 24px;">
                ⏰ هذا الرابط صالح لمدة 24 ساعة فقط
              </p>

              <div class="en-section">
                <h2>Welcome to Sabq!</h2>
                <p>Thank you for registering with Sabq News. To activate your account and enjoy all features, please confirm your email address.</p>
                <p style="color: #999; font-size: 13px;">
                  Or copy and paste this link into your browser:<br>
                  <span style="color: #0066cc; word-break: break-all;">${verificationLink}</span>
                </p>
                <p style="font-size: 13px; color: #999; margin-top: 16px;">
                  ⏰ This link is valid for 24 hours only
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} صحيفة سبق الإلكترونية - Sabq News</p>
              <p style="font-size: 12px; margin-top: 8px;">إذا لم تقم بالتسجيل، يرجى تجاهل هذه الرسالة</p>
              <p style="font-size: 12px; margin-top: 4px;">If you didn't sign up, please ignore this email</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
مرحباً بك في صحيفة سبق!

لتفعيل حسابك، يرجى النقر على الرابط التالي:
${verificationLink}

هذا الرابط صالح لمدة 24 ساعة فقط.

إذا لم تقم بالتسجيل، يرجى تجاهل هذه الرسالة.

---
Welcome to Sabq News!

To activate your account, please click the following link:
${verificationLink}

This link is valid for 24 hours only.

If you didn't sign up, please ignore this email.
      `.trim(),
    };

    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${email}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

/**
 * Verify email token
 */
export async function verifyEmailToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Find token in database
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token))
      .limit(1);

    if (!verificationToken) {
      return { success: false, error: 'Invalid verification token' };
    }

    // Check if token is already used
    if (verificationToken.used) {
      return { success: false, error: 'Verification token already used' };
    }

    // Check if token is expired
    if (new Date() > verificationToken.expiresAt) {
      return { success: false, error: 'Verification token expired' };
    }

    // Mark token as used
    await db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.token, token));

    // Update user email verification status
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, verificationToken.userId));

    console.log(`✅ Email verified for user ${verificationToken.userId}`);
    
    return { success: true, userId: verificationToken.userId };
  } catch (error) {
    console.error('❌ Failed to verify email token:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify email' 
    };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: false, error: 'Email already verified' };
    }

    // Send new verification email
    return await sendVerificationEmail(userId, user.email);
  } catch (error) {
    console.error('❌ Failed to resend verification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to resend email' 
    };
  }
}
