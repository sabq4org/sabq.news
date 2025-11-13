import crypto from 'crypto';
import { PressPassBuilder } from './PressPassBuilder';
import { LoyaltyPassBuilder } from './LoyaltyPassBuilder';
import { PassBuilder, CertificateConfig, PressPassData, LoyaltyPassData } from './PassBuilder';

export class PassKitService {
  private pressPassTypeId: string;
  private loyaltyPassTypeId: string;
  private teamId: string;
  
  private pressBuilder: PressPassBuilder;
  private loyaltyBuilder: LoyaltyPassBuilder;
  
  constructor() {
    this.pressPassTypeId = process.env.APPLE_PRESS_PASS_TYPE_ID || 'pass.life.sabq.presscard';
    this.loyaltyPassTypeId = process.env.APPLE_LOYALTY_PASS_TYPE_ID || 'pass.life.sabq.loyalty';
    this.teamId = process.env.APPLE_TEAM_ID || 'PLACEHOLDER';
    
    this.pressBuilder = new PressPassBuilder(this.pressPassTypeId, this.teamId);
    this.loyaltyBuilder = new LoyaltyPassBuilder(this.loyaltyPassTypeId, this.teamId);
  }
  
  async generatePressPass(data: PressPassData): Promise<Buffer> {
    const certificates = await this.loadCertificates('press');
    return this.pressBuilder.generatePass(data, certificates);
  }
  
  async generateLoyaltyPass(data: LoyaltyPassData): Promise<Buffer> {
    const certificates = await this.loadCertificates('loyalty');
    return this.loyaltyBuilder.generatePass(data, certificates);
  }
  
  private async loadCertificates(passType: 'press' | 'loyalty'): Promise<CertificateConfig> {
    console.log(`🔐 [PassKit] Loading certificates for ${passType} pass...`);
    
    // Load certificates based on pass type
    const certPath = passType === 'press' 
      ? (process.env.APPLE_PRESS_PASS_CERT || process.env.APPLE_PASS_CERT)
      : (process.env.APPLE_LOYALTY_PASS_CERT || process.env.APPLE_PASS_CERT);
    
    const keyPath = passType === 'press'
      ? (process.env.APPLE_PRESS_PASS_KEY || process.env.APPLE_PASS_KEY)
      : (process.env.APPLE_LOYALTY_PASS_KEY || process.env.APPLE_PASS_KEY);
    
    const wwdrPath = process.env.APPLE_WWDR_CERT;
    
    console.log(`🔐 [PassKit] Cert path length: ${certPath?.length || 0}`);
    console.log(`🔐 [PassKit] Key path length: ${keyPath?.length || 0}`);
    console.log(`🔐 [PassKit] WWDR path length: ${wwdrPath?.length || 0}`);
    
    if (!certPath || !keyPath) {
      throw new Error(
        'تعذر إصدار البطاقة لأن بيانات الاعتماد الخاصة بـ Apple Wallet غير مكتملة. يرجى التواصل مع المسؤول.'
      );
    }
    
    // Split certificates if multiple are in the same variable
    const { signerCert, wwdr } = this.splitCertificates(certPath);
    
    console.log(`🔐 [PassKit] Signer cert type: ${typeof signerCert}, length: ${signerCert.toString().length}`);
    console.log(`🔐 [PassKit] WWDR from split: ${wwdr ? 'YES' : 'NO'}`);
    
    const config: CertificateConfig = {
      signerCert: signerCert,
      signerKey: this.loadCertificate(keyPath),
    };
    
    // Use extracted WWDR or separate WWDR cert
    if (wwdr) {
      console.log(`✅ [PassKit] Using WWDR from split certificate`);
      config.wwdr = wwdr;
    } else if (wwdrPath) {
      console.log(`✅ [PassKit] Loading WWDR from separate env var`);
      config.wwdr = this.loadCertificate(wwdrPath);
    } else {
      console.error(`❌ [PassKit] NO WWDR CERTIFICATE FOUND!`);
      throw new Error(
        'WWDR certificate not found. Please provide APPLE_WWDR_CERT or include it in the pass certificate.'
      );
    }
    
    console.log(`✅ [PassKit] WWDR loaded: ${config.wwdr ? 'YES' : 'NO'}`);
    
    if (process.env.APPLE_PASS_KEY_PASSWORD) {
      config.signerKeyPassphrase = process.env.APPLE_PASS_KEY_PASSWORD;
    }
    
    return config;
  }
  
  private splitCertificates(certString: string): { signerCert: Buffer | string; wwdr?: Buffer | string } {
    // Check if it's a file path
    if (certString.startsWith('/') || certString.startsWith('./') || certString.includes('\\')) {
      return { signerCert: certString };
    }
    
    // Check if base64
    if (certString.match(/^[A-Za-z0-9+/=]+$/)) {
      return { signerCert: Buffer.from(certString, 'base64') };
    }
    
    // Split multiple PEM certificates
    const certBuffer = Buffer.from(certString, 'utf-8');
    const certText = certBuffer.toString('utf-8');
    
    // Match all certificates in the string
    const certMatches = certText.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
    
    if (!certMatches || certMatches.length === 0) {
      return { signerCert: certBuffer };
    }
    
    if (certMatches.length === 1) {
      // Only one certificate found
      return { signerCert: Buffer.from(certMatches[0], 'utf-8') };
    }
    
    // Multiple certificates found - first is signer, second is WWDR
    return {
      signerCert: Buffer.from(certMatches[0], 'utf-8'),
      wwdr: Buffer.from(certMatches[1], 'utf-8'),
    };
  }
  
  private loadCertificate(envVar: string): Buffer | string {
    if (envVar.startsWith('/') || envVar.startsWith('./') || envVar.includes('\\')) {
      return envVar;
    }
    
    if (envVar.match(/^[A-Za-z0-9+/=]+$/)) {
      return Buffer.from(envVar, 'base64');
    }
    
    return Buffer.from(envVar, 'utf-8');
  }
  
  generateSerialNumber(userId: string, passType: 'press' | 'loyalty'): string {
    const prefix = passType === 'press' ? 'SABQ-PRESS' : 'SABQ-LOYAL';
    return `${prefix}-${userId.substring(0, 8).toUpperCase()}`;
  }
  
  generateAuthToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const passKitService = new PassKitService();
export type { PressPassData, LoyaltyPassData };
