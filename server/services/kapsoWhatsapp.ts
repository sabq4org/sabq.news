import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';

const kapsoApiKey = process.env.KAPSO_API_KEY;
const kapsoPhoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;

export const isKapsoConfigured = !!(kapsoApiKey && kapsoPhoneNumberId);

if (!kapsoApiKey) {
  console.warn('⚠️ KAPSO_API_KEY not configured - Kapso WhatsApp features disabled');
}

if (!kapsoPhoneNumberId) {
  console.warn('⚠️ KAPSO_PHONE_NUMBER_ID not configured - Kapso WhatsApp features disabled');
}

export const kapsoClient = kapsoApiKey 
  ? new WhatsAppClient({
      baseUrl: 'https://app.kapso.ai/api/meta/',
      kapsoApiKey: kapsoApiKey
    })
  : null;

export interface KapsoSendMessageOptions {
  to: string;
  body: string;
  mediaUrl?: string;
}

export interface KapsoSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const lastInboundMessageTime = new Map<string, number>();

export function updateKapsoLastInboundTime(phoneNumber: string): void {
  const cleanNumber = phoneNumber.replace(/^\+/, '');
  lastInboundMessageTime.set(cleanNumber, Date.now());
  console.log(`[Kapso WhatsApp] 📥 Updated last inbound time for ${cleanNumber.substring(0, 8)}...`);
}

export function isKapsoWithin24HourWindow(phoneNumber: string): boolean {
  const cleanNumber = phoneNumber.replace(/^\+/, '');
  const lastTime = lastInboundMessageTime.get(cleanNumber);
  
  if (!lastTime) {
    return true;
  }
  
  const hoursSince = (Date.now() - lastTime) / (1000 * 60 * 60);
  return hoursSince < 24;
}

export async function sendKapsoWhatsAppMessage(options: KapsoSendMessageOptions): Promise<KapsoSendResult> {
  if (!kapsoClient || !kapsoPhoneNumberId) {
    console.error('[Kapso WhatsApp] ❌ Kapso not configured');
    return { success: false, error: 'Kapso not configured' };
  }

  const startTime = Date.now();
  const toNumber = options.to.replace(/^whatsapp:/i, '').replace(/^\+/, '');
  
  try {
    console.log(`[Kapso WhatsApp] 📨 Sending WhatsApp message...`);
    console.log(`[Kapso WhatsApp]   - Phone Number ID: ${kapsoPhoneNumberId}`);
    console.log(`[Kapso WhatsApp]   - To: ${toNumber}`);
    console.log(`[Kapso WhatsApp]   - Body length: ${options.body.length} chars`);
    console.log(`[Kapso WhatsApp]   - Body preview: ${options.body.substring(0, 100)}...`);
    
    if (options.mediaUrl) {
      const response = await kapsoClient.messages.sendImage({
        phoneNumberId: kapsoPhoneNumberId,
        to: toNumber,
        image: {
          link: options.mediaUrl,
          caption: options.body
        }
      });
      
      const elapsed = Date.now() - startTime;
      console.log(`[Kapso WhatsApp] ✅ Image message sent in ${elapsed}ms`);
      
      return {
        success: true,
        messageId: (response as any)?.messages?.[0]?.id
      };
    } else {
      const response = await kapsoClient.messages.sendText({
        phoneNumberId: kapsoPhoneNumberId,
        to: toNumber,
        body: options.body
      });
      
      const elapsed = Date.now() - startTime;
      console.log(`[Kapso WhatsApp] ✅ Text message sent in ${elapsed}ms`);
      
      return {
        success: true,
        messageId: (response as any)?.messages?.[0]?.id
      };
    }
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[Kapso WhatsApp] ❌ Error sending message (${elapsed}ms):`, {
      message: error.message,
      status: error.status,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

export async function sendKapsoTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'ar',
  components?: any[]
): Promise<KapsoSendResult> {
  if (!kapsoClient || !kapsoPhoneNumberId) {
    console.error('[Kapso WhatsApp] ❌ Kapso not configured');
    return { success: false, error: 'Kapso not configured' };
  }

  const toNumber = to.replace(/^whatsapp:/i, '').replace(/^\+/, '');
  
  try {
    console.log(`[Kapso WhatsApp] 📨 Sending template message...`);
    console.log(`[Kapso WhatsApp]   - Template: ${templateName}`);
    console.log(`[Kapso WhatsApp]   - Language: ${languageCode}`);
    console.log(`[Kapso WhatsApp]   - To: ${toNumber}`);
    
    const templatePayload: any = {
      phoneNumberId: kapsoPhoneNumberId,
      to: toNumber,
      template: {
        name: templateName,
        language: { code: languageCode }
      }
    };
    
    if (components && components.length > 0) {
      templatePayload.template.components = components;
    }
    
    const response = await (kapsoClient as any).templates.send(templatePayload);
    
    console.log(`[Kapso WhatsApp] ✅ Template message sent`);
    
    return {
      success: true,
      messageId: (response as any)?.messages?.[0]?.id
    };
  } catch (error: any) {
    console.error(`[Kapso WhatsApp] ❌ Error sending template:`, {
      message: error.message,
      status: error.status,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

export function getKapsoStatus(): {
  configured: boolean;
  phoneNumberId: string | null;
} {
  return {
    configured: isKapsoConfigured,
    phoneNumberId: kapsoPhoneNumberId || null
  };
}

console.log(`✅ Kapso WhatsApp service initialized`, getKapsoStatus());
