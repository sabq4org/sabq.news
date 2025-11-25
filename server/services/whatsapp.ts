import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// 🔧 FIX: Remove 'whatsapp:' prefix if it exists to prevent duplication
const rawWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || '';
const whatsappNumber = rawWhatsappNumber.replace(/^whatsapp:/i, '');

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
    console.error('[WhatsApp Service] ❌ Twilio not configured');
    console.error('[WhatsApp Service]   - twilioClient:', !!twilioClient);
    console.error('[WhatsApp Service]   - whatsappNumber:', whatsappNumber);
    return false;
  }

  try {
    console.log(`[WhatsApp Service] 📨 Sending WhatsApp message...`);
    console.log(`[WhatsApp Service]   - From: whatsapp:${whatsappNumber}`);
    console.log(`[WhatsApp Service]   - To: whatsapp:${options.to}`);
    console.log(`[WhatsApp Service]   - Body length: ${options.body.length} chars`);
    
    const messageOptions: any = {
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${options.to}`,
      body: options.body,
    };

    if (options.mediaUrl) {
      messageOptions.mediaUrl = [options.mediaUrl];
      console.log(`[WhatsApp Service]   - Media URL: ${options.mediaUrl}`);
    }

    console.log(`[WhatsApp Service] 🔄 Calling Twilio API...`);
    const message = await twilioClient.messages.create(messageOptions);
    
    console.log(`[WhatsApp Service] ✅ Message sent successfully: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('[WhatsApp Service] ❌ Failed to send message:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      console.error('[WhatsApp Service] Error details:', error);
      console.error('[WhatsApp Service] Stack:', error.stack);
    }
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
    // Try pattern with space (with or without #), ensure token part is uppercase/numbers
    const spacePattern = /\b#?TOKEN\s+([A-Z0-9\-_]+)/i;
    match = message.match(spacePattern);
  }
  
  return match ? match[1].toUpperCase() : null;
}

export function removeTokenFromMessage(message: string): string {
  // Remove TOKEN patterns (with or without #, with :, -, or space)
  // Also remove any leftover # symbol at start of line after token removal
  return message
    .replace(/\b#?TOKEN[:\-][A-Z0-9\-_]+/gi, '')
    .replace(/\b#?TOKEN\s+[A-Z0-9\-_]+/gi, '')
    .replace(/^#\s*/gm, '')  // Remove leftover # at start of lines
    .trim();
}

console.log('✅ WhatsApp service initialized', {
  configured: !!twilioClient,
  rawNumber: rawWhatsappNumber ? `${rawWhatsappNumber.substring(0, 12)}...` : 'not set',
  cleanNumber: whatsappNumber ? `${whatsappNumber.substring(0, 8)}...` : 'not set'
});
