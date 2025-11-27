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

export interface SendMessageResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
}

async function sendWithRetry(
  messageOptions: any, 
  maxRetries: number = 3,
  delayMs: number = 500
): Promise<SendMessageResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await twilioClient!.messages.create(messageOptions);
      return {
        success: true,
        sid: message.sid,
        status: message.status
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[WhatsApp Service] ⚠️ Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Unknown error after retries'
  };
}

export async function sendWhatsAppMessage(options: SendWhatsAppMessageOptions): Promise<boolean> {
  if (!twilioClient || !whatsappNumber) {
    console.error('[WhatsApp Service] ❌ Twilio not configured');
    return false;
  }

  const startTime = Date.now();
  
  try {
    console.log(`[WhatsApp Service] 📨 Sending WhatsApp message...`);
    console.log(`[WhatsApp Service]   - To: ${options.to}`);
    console.log(`[WhatsApp Service]   - Body: ${options.body.substring(0, 100)}...`);
    
    const toNumber = options.to.replace(/^whatsapp:/i, '');
    
    const messageOptions: any = {
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${toNumber}`,
      body: options.body,
    };

    if (options.mediaUrl) {
      messageOptions.mediaUrl = [options.mediaUrl];
    }

    const result = await sendWithRetry(messageOptions, 3, 300);
    const elapsed = Date.now() - startTime;
    
    if (result.success) {
      console.log(`[WhatsApp Service] ✅ Message sent in ${elapsed}ms - SID: ${result.sid} - Status: ${result.status}`);
      return true;
    } else {
      console.error(`[WhatsApp Service] ❌ Failed after retries (${elapsed}ms): ${result.error}`);
      return false;
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[WhatsApp Service] ❌ Exception (${elapsed}ms):`, error instanceof Error ? error.message : error);
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
