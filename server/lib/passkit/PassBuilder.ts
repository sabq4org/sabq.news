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
  signerCert: Buffer | string;
  signerKey: Buffer | string;
  wwdr: Buffer | string;
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
      console.log('🔐 [PassBuilder] Generating pass...');
      console.log('🔐 [PassBuilder] Certificate types:', {
        signerCert: typeof certificates.signerCert,
        signerKey: typeof certificates.signerKey,
        wwdr: typeof certificates.wwdr,
      });
      console.log('🔐 [PassBuilder] Certificate keys:', Object.keys(certificates));
      console.log('🔐 [PassBuilder] Has wwdr:', 'wwdr' in certificates);
      console.log('🔐 [PassBuilder] wwdr value:', certificates.wwdr ? 'EXISTS' : 'UNDEFINED/NULL');
      console.log('🔐 [PassBuilder] wwdr length:', certificates.wwdr?.length || 0);
      
      // Convert strings to Buffers for PKPass
      const pkpassCerts = {
        signerCert: typeof certificates.signerCert === 'string' 
          ? Buffer.from(certificates.signerCert, 'utf-8') 
          : certificates.signerCert,
        signerKey: typeof certificates.signerKey === 'string'
          ? Buffer.from(certificates.signerKey, 'utf-8')
          : certificates.signerKey,
        wwdr: typeof certificates.wwdr === 'string'
          ? Buffer.from(certificates.wwdr, 'utf-8')
          : certificates.wwdr,
        ...(certificates.signerKeyPassphrase && { signerKeyPassphrase: certificates.signerKeyPassphrase }),
      };
      
      console.log('🔐 [PassBuilder] PKPass certs types:', {
        signerCert: typeof pkpassCerts.signerCert,
        signerKey: typeof pkpassCerts.signerKey,
        wwdr: typeof pkpassCerts.wwdr,
      });
      
      const pass = new PKPass(
        {
          model: this.getTemplatePath(),
          certificates: pkpassCerts,
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
