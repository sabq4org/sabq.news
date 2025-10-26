import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

/**
 * Send OTP via SMS using Twilio Verify
 */
export async function sendSMSOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!process.env.TWILIO_VERIFY_SID) {
      throw new Error('TWILIO_VERIFY_SID environment variable is not configured');
    }

    const client = await getTwilioClient();
    
    console.log('📱 Sending SMS OTP to:', phoneNumber);
    
    // Use Twilio Verify API to send OTP
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms'
      });

    console.log('✅ SMS OTP sent successfully:', { to: phoneNumber, status: verification.status });

    return {
      success: verification.status === 'pending',
      message: verification.status === 'pending' 
        ? 'تم إرسال رمز التحقق إلى رقم جوالك'
        : 'فشل في إرسال رمز التحقق'
    };
  } catch (error: any) {
    console.error('❌ Error sending SMS OTP:', error.message || error);
    return {
      success: false,
      message: 'فشل في إرسال رمز التحقق. تأكد من صحة رقم الجوال'
    };
  }
}

/**
 * Verify OTP code sent via SMS
 */
export async function verifySMSOTP(phoneNumber: string, code: string): Promise<{ valid: boolean; message: string }> {
  try {
    if (!process.env.TWILIO_VERIFY_SID) {
      throw new Error('TWILIO_VERIFY_SID environment variable is not configured');
    }

    const client = await getTwilioClient();
    
    console.log('🔍 Verifying SMS OTP for:', phoneNumber);
    
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks
      .create({
        to: phoneNumber,
        code: code
      });

    console.log('✅ SMS OTP verification result:', { to: phoneNumber, status: verificationCheck.status });

    return {
      valid: verificationCheck.status === 'approved',
      message: verificationCheck.status === 'approved'
        ? 'تم التحقق بنجاح'
        : 'الرمز غير صحيح أو منتهي الصلاحية'
    };
  } catch (error: any) {
    console.error('❌ Error verifying SMS OTP:', error.message || error);
    return {
      valid: false,
      message: 'الرمز غير صحيح أو منتهي الصلاحية'
    };
  }
}
