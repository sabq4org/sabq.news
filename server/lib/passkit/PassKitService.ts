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
    
    console.log(`🔐 [PassKit] Signer cert type: ${typeof signerCert}, length: ${signerCert.length}`);
    console.log(`🔐 [PassKit] Signer cert starts with: ${signerCert.substring(0, 30)}`);
    console.log(`🔐 [PassKit] WWDR from split: ${wwdr ? 'YES' : 'NO'}`);
    
    // Determine WWDR certificate source - MUST be PEM string
    let wwdrCert: string;
    
    if (wwdr) {
      console.log(`✅ [PassKit] Using WWDR from split certificate`);
      wwdrCert = wwdr;
    } else if (wwdrPath) {
      console.log(`✅ [PassKit] Loading WWDR from separate env var`);
      wwdrCert = this.loadCertificate(wwdrPath);
    } else {
      console.error(`❌ [PassKit] NO WWDR CERTIFICATE FOUND!`);
      throw new Error(
        'WWDR certificate not found. Please provide APPLE_WWDR_CERT or include it in the pass certificate.'
      );
    }
    
    // Load signing key
    const signerKey = this.loadCertificate(keyPath);
    
    // All certificates are now PEM strings - perfect for PKPass!
    const config: CertificateConfig = {
      signerCert: signerCert,
      signerKey: signerKey,
      wwdr: wwdrCert,
    };
    
    if (process.env.APPLE_PASS_KEY_PASSWORD) {
      config.signerKeyPassphrase = process.env.APPLE_PASS_KEY_PASSWORD;
    }
    
    console.log(`✅ [PassKit] Certificate config complete - all PEM strings`);
    console.log(`✅ [PassKit] signerCert type: ${typeof config.signerCert}, starts with: ${config.signerCert.substring(0, 30)}`);
    console.log(`✅ [PassKit] signerKey type: ${typeof config.signerKey}, starts with: ${config.signerKey.substring(0, 30)}`);
    console.log(`✅ [PassKit] wwdr type: ${typeof config.wwdr}, starts with: ${config.wwdr.substring(0, 30)}`);
    
    return config;
  }
  
  private splitCertificates(certString: string): { signerCert: string; wwdr?: string } {
    // If it's a file path, read the file content
    if (certString.startsWith('/') || certString.startsWith('./') || certString.includes('\\')) {
      const fs = require('fs');
      certString = fs.readFileSync(certString, 'utf-8');
    }
    
    // Check if base64 - decode it to PEM string
    if (certString.match(/^[A-Za-z0-9+/=]+$/) && !certString.includes('-----BEGIN')) {
      // Pure base64 without PEM headers - decode to PEM string
      certString = Buffer.from(certString, 'base64').toString('utf-8');
    }
    
    // Now certString should be PEM format text
    // Match all certificates in the string
    const certMatches = certString.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
    
    if (!certMatches || certMatches.length === 0) {
      // No PEM headers found - return as is (might be raw PEM)
      return { signerCert: certString };
    }
    
    if (certMatches.length === 1) {
      // Only one certificate found - return as PEM string
      return { signerCert: certMatches[0] };
    }
    
    // Multiple certificates found - first is signer, second is WWDR
    return {
      signerCert: certMatches[0],
      wwdr: certMatches[1],
    };
  }
  
  private loadCertificate(envVar: string): string {
    // If it's a file path, read the file content
    if (envVar.startsWith('/') || envVar.startsWith('./') || envVar.includes('\\')) {
      const fs = require('fs');
      return fs.readFileSync(envVar, 'utf-8');
    }
    
    // Check if base64 - decode to PEM string
    if (envVar.match(/^[A-Za-z0-9+/=]+$/) && !envVar.includes('-----BEGIN')) {
      return Buffer.from(envVar, 'base64').toString('utf-8');
    }
    
    // Otherwise treat as PEM string already
    return envVar;
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
