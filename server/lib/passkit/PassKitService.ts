import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
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
    console.log(`🔐 [PassKit] Signer cert starts with: ${signerCert.toString('utf-8').substring(0, 30)}`);
    console.log(`🔐 [PassKit] WWDR from split: ${wwdr ? 'YES' : 'NO'}`);
    
    // Determine WWDR certificate source - MUST be Buffer
    let wwdrCert: Buffer;
    
    // PRIORITY: Try to load from file first (most reliable)
    const wwdrFilePath = path.join(process.cwd(), 'certs', 'wwdr.pem');
    
    if (fs.existsSync(wwdrFilePath)) {
      console.log(`✅ [PassKit] Loading WWDR from file: ${wwdrFilePath}`);
      wwdrCert = fs.readFileSync(wwdrFilePath);
    } else if (wwdr) {
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
    
    // All certificates are now Buffers - ready for PKPass!
    const config: CertificateConfig = {
      signerCert: signerCert,
      signerKey: signerKey,
      wwdr: wwdrCert,
    };
    
    if (process.env.APPLE_PASS_KEY_PASSWORD) {
      config.signerKeyPassphrase = process.env.APPLE_PASS_KEY_PASSWORD;
    }
    
    console.log(`✅ [PassKit] Certificate config complete - all Buffers`);
    console.log(`✅ [PassKit] signerCert type: ${typeof config.signerCert}, length: ${config.signerCert.length}`);
    console.log(`✅ [PassKit] signerKey type: ${typeof config.signerKey}, length: ${config.signerKey.length}`);
    console.log(`✅ [PassKit] wwdr type: ${typeof config.wwdr}, length: ${config.wwdr.length}`);
    
    // 🔥 GOLDEN DEBUG LOG - Shows EXACTLY what PKPass will see
    console.log('\n🔥🔥🔥 CRITICAL DEBUG - FIRST 120 CHARS OF WWDR:');
    const wwdrStr = config.wwdr.toString('utf-8');
    console.log(wwdrStr.substring(0, 120));
    console.log('\n🔥🔥🔥 WWDR FULL LENGTH:', wwdrStr.length);
    console.log('🔥🔥🔥 HAS "BEGIN CERTIFICATE":', wwdrStr.includes('-----BEGIN CERTIFICATE-----'));
    console.log('🔥🔥🔥 HAS "END CERTIFICATE":', wwdrStr.includes('-----END CERTIFICATE-----'));
    console.log('🔥🔥🔥 HAS NEWLINES:', wwdrStr.includes('\n'));
    
    return config;
  }
  
  private splitCertificates(certString: string): { signerCert: Buffer; wwdr?: Buffer } {
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
      // No PEM headers found - return as Buffer
      return { signerCert: Buffer.from(certString, 'utf-8') };
    }
    
    if (certMatches.length === 1) {
      // Only one certificate found - return as Buffer
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
      const content = fs.readFileSync(envVar, 'utf-8');
      return Buffer.from(content, 'utf-8');
    }
    
    // Check if base64 - decode to PEM string then to Buffer
    if (envVar.match(/^[A-Za-z0-9+/=]+$/) && !envVar.includes('-----BEGIN')) {
      const pemString = Buffer.from(envVar, 'base64').toString('utf-8');
      return Buffer.from(pemString, 'utf-8');
    }
    
    // Otherwise treat as PEM string already - convert to Buffer
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
