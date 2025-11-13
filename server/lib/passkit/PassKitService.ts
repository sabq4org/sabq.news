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
    // Load certificates based on pass type
    const certPath = passType === 'press' 
      ? (process.env.APPLE_PRESS_PASS_CERT || process.env.APPLE_PASS_CERT)
      : (process.env.APPLE_LOYALTY_PASS_CERT || process.env.APPLE_PASS_CERT);
    
    const keyPath = passType === 'press'
      ? (process.env.APPLE_PRESS_PASS_KEY || process.env.APPLE_PASS_KEY)
      : (process.env.APPLE_LOYALTY_PASS_KEY || process.env.APPLE_PASS_KEY);
    
    const wwdrPath = process.env.APPLE_WWDR_CERT;
    
    if (!certPath || !keyPath) {
      throw new Error(
        'تعذر إصدار البطاقة لأن بيانات الاعتماد الخاصة بـ Apple Wallet غير مكتملة. يرجى التواصل مع المسؤول.'
      );
    }
    
    // Split certificates if multiple are in the same variable
    const { signerCert, wwdr } = this.splitCertificates(certPath);
    
    // Determine WWDR certificate source - MUST be Buffer
    let wwdrCert: Buffer;
    
    // PRIORITY: Try to load from file first (most reliable)
    const wwdrFilePath = path.join(process.cwd(), 'certs', 'wwdr.pem');
    
    if (fs.existsSync(wwdrFilePath)) {
      wwdrCert = fs.readFileSync(wwdrFilePath);
    } else if (wwdr) {
      wwdrCert = wwdr;
    } else if (wwdrPath) {
      wwdrCert = this.loadCertificate(wwdrPath);
    } else {
      throw new Error(
        'WWDR certificate not found. Please provide APPLE_WWDR_CERT or include it in the pass certificate.'
      );
    }
    
    // Load signing key
    const signerKeyBuffer = this.loadCertificate(keyPath);
    
    // Convert all Buffers to strings for PKPass
    const config: CertificateConfig = {
      signerCert: signerCert.toString('utf-8'),
      signerKey: signerKeyBuffer.toString('utf-8'),
      wwdr: wwdrCert.toString('utf-8'),
    };
    
    if (process.env.APPLE_PASS_KEY_PASSWORD) {
      config.signerKeyPassphrase = process.env.APPLE_PASS_KEY_PASSWORD;
    }
    
    return config;
  }
  
  private splitCertificates(certString: string): { signerCert: Buffer; wwdr?: Buffer } {
    // If it's a file path, read the file content
    if (certString.startsWith('/') || certString.startsWith('./') || certString.includes('\\')) {
      const fs = require('fs');
      certString = fs.readFileSync(certString, 'utf-8');
    }
    
    // Clean the input - remove any whitespace/newlines from base64
    const cleaned = certString.replace(/\s/g, '');
    
    // Check if base64 - decode it to PEM string
    if (cleaned.match(/^[A-Za-z0-9+/=]+$/) && !certString.includes('-----BEGIN')) {
      try {
        certString = Buffer.from(cleaned, 'base64').toString('utf-8');
      } catch (error) {
        console.error('❌ [PassKit] Failed to decode base64 in splitCertificates:', error);
        throw new Error('Invalid certificate: failed to decode base64');
      }
    }
    
    // Now certString should be PEM format text
    // Match all certificates in the string
    const certMatches = certString.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
    
    if (!certMatches || certMatches.length === 0) {
      console.error('❌ [PassKit] No valid PEM certificates found in cert string');
      console.error('First 100 chars:', certString.substring(0, 100));
      throw new Error('No valid PEM certificates found');
    }
    
    if (certMatches.length === 1) {
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
      console.log(`✅ [PassKit] Loaded certificate from file: ${envVar.substring(0, 50)}...`);
      return Buffer.from(content, 'utf-8');
    }
    
    // Log what we're dealing with
    console.log(`🔍 [PassKit] Processing certificate (length: ${envVar.length}, first 50 chars: ${envVar.substring(0, 50)})`);
    
    // Clean the input - remove any whitespace/newlines
    const cleaned = envVar.replace(/\s/g, '');
    
    // Check if base64 - decode to PEM string then to Buffer
    if (cleaned.match(/^[A-Za-z0-9+/=]+$/) && !envVar.includes('-----BEGIN')) {
      console.log('🔍 [PassKit] Detected base64 format, attempting to decode...');
      try {
        const pemString = Buffer.from(cleaned, 'base64').toString('utf-8');
        console.log(`🔍 [PassKit] Decoded length: ${pemString.length}, first 100 chars: ${pemString.substring(0, 100)}`);
        
        // Validate PEM format
        if (!pemString.includes('-----BEGIN') || !pemString.includes('-----END')) {
          console.error('❌ [PassKit] Invalid PEM after base64 decode - missing headers');
          console.error(`First 200 chars of decoded content: ${pemString.substring(0, 200)}`);
          throw new Error('Invalid certificate: base64 decoded but no PEM headers found');
        }
        console.log('✅ [PassKit] Successfully decoded base64 to valid PEM format');
        return Buffer.from(this.normalizePEM(pemString), 'utf-8');
      } catch (error) {
        console.error('❌ [PassKit] Failed to decode base64 certificate:', error);
        throw new Error('Invalid certificate: failed to decode base64');
      }
    }
    
    // Otherwise treat as PEM string already - validate and normalize it
    if (envVar.includes('-----BEGIN') && envVar.includes('-----END')) {
      console.log('✅ [PassKit] Using PEM string directly (already in PEM format)');
      const normalized = this.normalizePEM(envVar);
      return Buffer.from(normalized, 'utf-8');
    }
    
    console.error('❌ [PassKit] Certificate format unknown - not base64, not file path, not PEM');
    console.error(`First 200 chars: ${envVar.substring(0, 200)}`);
    throw new Error('Invalid certificate format: must be PEM string, base64 encoded PEM, or file path');
  }
  
  private normalizePEM(pem: string): string {
    // Remove all existing whitespace
    const cleaned = pem.replace(/\s/g, '');
    
    // Extract header, body, and footer using regex
    const certMatch = cleaned.match(/^(-----BEGIN[A-Z\s]+-----)([A-Za-z0-9+/=]+)(-----END[A-Z\s]+-----)$/);
    
    if (!certMatch) {
      console.error('❌ [PassKit] Failed to parse PEM structure');
      return pem; // Return as-is if we can't parse it
    }
    
    const [, header, body, footer] = certMatch;
    
    // Split body into 64-character lines
    const lines = [];
    for (let i = 0; i < body.length; i += 64) {
      lines.push(body.substring(i, i + 64));
    }
    
    // Reconstruct with proper line breaks
    const normalized = `${header}\n${lines.join('\n')}\n${footer}`;
    console.log('✅ [PassKit] PEM normalized successfully');
    
    return normalized;
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
