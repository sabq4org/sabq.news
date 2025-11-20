import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken) {
  console.warn('⚠️ Twilio credentials not configured - WhatsApp features disabled');
}

export const twilioClient = accountSid && authToken 
  ? twilio(accountSid, authToken)
  : null;

export interface SendWhatsAppMessageOptions {
  to: string;
  body: string;
  mediaUrl?: string;
}

export async function sendWhatsAppMessage(options: SendWhatsAppMessageOptions): Promise<boolean> {
  if (!twilioClient || !whatsappNumber) {
    console.error('[WhatsApp Service] Twilio not configured');
    return false;
  }

  try {
    const messageOptions: any = {
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${options.to}`,
      body: options.body,
    };

    if (options.mediaUrl) {
      messageOptions.mediaUrl = [options.mediaUrl];
    }

    const message = await twilioClient.messages.create(messageOptions);
    
    console.log(`[WhatsApp Service] Message sent successfully: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('[WhatsApp Service] Failed to send message:', error);
    return false;
  }
}

export function validateTwilioSignature(signature: string, url: string, params: any): boolean {
  if (!authToken) {
    console.warn('[WhatsApp Service] Cannot validate signature - auth token not configured');
    return false;
  }

  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error('[WhatsApp Service] Signature validation error:', error);
    return false;
  }
}

export function extractTokenFromMessage(message: string): string | null {
  // Support multiple TOKEN patterns:
  // 1. #TOKEN:XXX or #TOKEN-XXX or #TOKEN XXX (with hash)
  // 2. TOKEN:XXX or TOKEN-XXX (without hash, requires colon or dash)
  // 3. TOKEN XXX (without hash, requires space after TOKEN and uppercase token)
  // Case insensitive matching for TOKEN word
  
  // First try patterns with explicit separators (: or -)
  const explicitPattern = /\b#?TOKEN[:\-]([A-Z0-9\-_]+)/i;
  let match = message.match(explicitPattern);
  
  if (!match) {
    // Try pattern with space, but ensure the token part is uppercase/numbers
    const spacePattern = /\bTOKEN\s+([A-Z0-9\-_]+)/i;
    match = message.match(spacePattern);
  }
  
  return match ? match[1].toUpperCase() : null;
}

export function removeTokenFromMessage(message: string): string {
  // Remove TOKEN patterns
  return message
    .replace(/\b#?TOKEN[:\-][A-Z0-9\-_]+/i, '')
    .replace(/\bTOKEN\s+[A-Z0-9\-_]+/i, '')
    .trim();
}

console.log('✅ WhatsApp service initialized', {
  configured: !!twilioClient,
  whatsappNumber: whatsappNumber ? `${whatsappNumber.substring(0, 8)}...` : 'not set'
});
