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
  const tokenPattern = /#TOKEN[:\s]*([A-Z0-9\-_]+)/i;
  const match = message.match(tokenPattern);
  return match ? match[1].toUpperCase() : null;
}

export function removeTokenFromMessage(message: string): string {
  return message.replace(/#TOKEN[:\s]*[A-Z0-9\-_]+/i, '').trim();
}

console.log('✅ WhatsApp service initialized', {
  configured: !!twilioClient,
  whatsappNumber: whatsappNumber ? `${whatsappNumber.substring(0, 8)}...` : 'not set'
});
