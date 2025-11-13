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
      console.log('🔐 [PassBuilder] Certificates object keys:', Object.keys(certificates));
      console.log('🔐 [PassBuilder] signerCert:', typeof certificates.signerCert, certificates.signerCert.length);
      console.log('🔐 [PassBuilder] signerKey:', typeof certificates.signerKey, certificates.signerKey.length);
      console.log('🔐 [PassBuilder] wwdr:', typeof certificates.wwdr, certificates.wwdr ? certificates.wwdr.length : 'UNDEFINED');
      console.log('🔐 [PassBuilder] wwdr exists:', 'wwdr' in certificates);
      
      // @ts-expect-error - PKPass types don't perfectly match our CertificateConfig, but runtime works
      const pass = new PKPass(
        {
          model: this.getTemplatePath(),
          certificates: certificates,
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
      throw new Error(`Failed to generate pass: ${error.message}`);
    }
  }
  
  protected abstract getBackgroundColor(): string;
}
