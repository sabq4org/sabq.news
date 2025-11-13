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
    
    // Determine WWDR certificate source - MUST be Buffer
    let wwdrCert: Buffer;
    
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
    
    const config: CertificateConfig = {
      signerCert: signerCert,
      signerKey: this.loadCertificate(keyPath),
      wwdr: wwdrCert,
    };
    
    if (process.env.APPLE_PASS_KEY_PASSWORD) {
      config.signerKeyPassphrase = process.env.APPLE_PASS_KEY_PASSWORD;
    }
    
    console.log(`✅ [PassKit] Certificate config complete - wwdr type: ${typeof config.wwdr}`);
    
    return config;
  }
  
  private splitCertificates(certString: string): { signerCert: Buffer; wwdr?: Buffer } {
    // If it's a file path, read the file content
    if (certString.startsWith('/') || certString.startsWith('./') || certString.includes('\\')) {
      const fs = require('fs');
      certString = fs.readFileSync(certString, 'utf-8');
    }
    
    // Check if base64 - decode it but preserve as string for PEM parsing
    if (certString.match(/^[A-Za-z0-9+/=]+$/) && !certString.includes('-----BEGIN')) {
      // Pure base64 without PEM headers - decode it
      certString = Buffer.from(certString, 'base64').toString('utf-8');
    }
    
    // Now certString should be PEM format text
    // Match all certificates in the string
    const certMatches = certString.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
    
    if (!certMatches || certMatches.length === 0) {
      // No PEM headers found - treat as raw cert data
      return { signerCert: Buffer.from(certString, 'utf-8') };
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
  
  private loadCertificate(envVar: string): Buffer {
    // If it's a file path, read the file content
    if (envVar.startsWith('/') || envVar.startsWith('./') || envVar.includes('\\')) {
      const fs = require('fs');
      return Buffer.from(fs.readFileSync(envVar, 'utf-8'), 'utf-8');
    }
    
    // Check if base64
    if (envVar.match(/^[A-Za-z0-9+/=]+$/)) {
      return Buffer.from(envVar, 'base64');
    }
    
    // Otherwise treat as PEM string
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
