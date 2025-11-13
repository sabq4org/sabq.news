import { PKPass } from 'passkit-generator';
import path from 'path';
import crypto from 'crypto';

export interface PassData {
  userId: string;
  serialNumber: string;
  authToken: string;
  userName: string;
  userEmail: string;
  userRole: string;
  profileImageUrl?: string;
}

export interface LoyaltyPassData extends PassData {
  totalPoints: number;
  currentRank: string;
  rankLevel: number;
  memberSince: Date;
}

export interface PressPassData extends PassData {
  jobTitle?: string;
  department?: string;
  pressIdNumber?: string;
  validUntil?: Date;
}

export interface CertificateConfig {
  signerCert: Buffer;
  signerKey: Buffer;
  wwdr: Buffer;
  signerKeyPassphrase?: string;
}

export abstract class PassBuilder {
  protected passTypeId: string;
  protected teamId: string;
  
  constructor(passTypeId: string, teamId: string) {
    this.passTypeId = passTypeId;
    this.teamId = teamId;
  }
  
  abstract getTemplatePath(): string;
  abstract getPassDescription(): string;
  abstract getOrganizationName(): string;
  abstract configurePassFields(pass: PKPass, data: any): void;
  
  async generatePass(data: any, certificates: CertificateConfig): Promise<Buffer> {
    try {
      console.log('🔐 [PassBuilder] Generating pass - converting Buffers to strings...');
      
      // 🔥 CRITICAL FIX: PKPass expects strings, not Buffers!
      const certificateStrings = {
        wwdr: certificates.wwdr.toString('utf-8'),
        signerCert: certificates.signerCert.toString('utf-8'),
        signerKey: certificates.signerKey.toString('utf-8'),
        signerKeyPassphrase: certificates.signerKeyPassphrase,
      };
      
      console.log('✅ [PassBuilder] Certificates converted to strings:', {
        wwdr: typeof certificateStrings.wwdr,
        signerCert: typeof certificateStrings.signerCert,
        signerKey: typeof certificateStrings.signerKey,
      });
      console.log('✅ [PassBuilder] WWDR string length:', certificateStrings.wwdr.length);
      console.log('✅ [PassBuilder] WWDR starts with:', certificateStrings.wwdr.substring(0, 30));
      
      const pass = new PKPass(
        {
          model: this.getTemplatePath(),
          certificates: certificateStrings,
        },
        {
          serialNumber: data.serialNumber,
          description: this.getPassDescription(),
          organizationName: this.getOrganizationName(),
          passTypeIdentifier: this.passTypeId,
          teamIdentifier: this.teamId,
          authenticationToken: data.authToken,
          webServiceURL: process.env.FRONTEND_URL || 'https://sabq.life',
          backgroundColor: this.getBackgroundColor(),
          foregroundColor: 'rgb(255, 255, 255)',
          labelColor: 'rgb(255, 255, 255)',
          barcodes: [
            {
              format: 'PKBarcodeFormatQR',
              message: data.userId,
              messageEncoding: 'iso-8859-1',
            },
          ],
        }
      );
      
      this.configurePassFields(pass, data);
      
      const buffer = await pass.getAsBuffer();
      return buffer;
    } catch (error: any) {
      console.log('❌ [PassBuilder] PKPass error:', error);
      if (error.details) {
        console.log('❌ [PassBuilder] Validation details:', JSON.stringify(error.details, null, 2));
      }
      throw new Error(`Failed to generate pass: ${error.message}`);
    }
  }
  
  protected abstract getBackgroundColor(): string;
}
