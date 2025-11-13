import { PKPass } from 'passkit-generator';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';

export interface PassData {
  userId: string;
  serialNumber: string;
  authToken: string;
  userName: string;
  userEmail: string;
  userRole: string;
  profileImageUrl?: string;
}

export class PassKitService {
  private passTypeId: string;
  private teamId: string;
  
  constructor() {
    this.passTypeId = process.env.APPLE_PASS_TYPE_ID || 'pass.life.sabq.presscard';
    this.teamId = process.env.APPLE_TEAM_ID || 'PLACEHOLDER';
  }

  async generatePass(data: PassData): Promise<Buffer> {
    // Check if Apple credentials are configured
    if (!process.env.APPLE_PASS_CERT || !process.env.APPLE_PASS_KEY) {
      throw new Error(
        'Apple Wallet Pass generation requires Apple Developer credentials. ' +
        'Please configure: APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, APPLE_PASS_CERT, APPLE_PASS_KEY'
      );
    }

    try {
      // Create pass instance
      const pass = new PKPass(
        {
          // Model path (we'll create this directory structure)
          model: path.resolve(__dirname, './pass-template'),
          
          // Certificates
          certificates: {
            wwdr: process.env.APPLE_WWDR_CERT || '', // WWDR certificate path
            signerCert: process.env.APPLE_PASS_CERT || '',
            signerKey: process.env.APPLE_PASS_KEY || '',
            signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSWORD,
          },
        },
        {
          // Pass metadata
          serialNumber: data.serialNumber,
          description: 'Sabq Smart Press Card',
          organizationName: 'Sabq Smart',
          passTypeIdentifier: this.passTypeId,
          teamIdentifier: this.teamId,
          
          // Auth token for PassKit web service
          authenticationToken: data.authToken,
          webServiceURL: process.env.FRONTEND_URL || 'https://sabq.life',
          
          // Visual appearance
          backgroundColor: 'rgb(0, 122, 255)',
          foregroundColor: 'rgb(255, 255, 255)',
          labelColor: 'rgb(255, 255, 255)',
          
          // Barcode (QR code with user ID)
          barcodes: [
            {
              format: 'PKBarcodeFormatQR',
              message: data.userId,
              messageEncoding: 'iso-8859-1',
            },
          ],
        }
      );

      // Add header fields
      pass.headerFields.push({
        key: 'role',
        label: 'الدور',
        value: this.translateRole(data.userRole),
      });

      // Add primary fields
      pass.primaryFields.push({
        key: 'name',
        label: 'الاسم',
        value: data.userName,
      });

      // Add secondary fields
      pass.secondaryFields.push({
        key: 'email',
        label: 'البريد الإلكتروني',
        value: data.userEmail,
      });

      // Add auxiliary fields
      pass.auxiliaryFields.push({
        key: 'serial',
        label: 'الرقم التسلسلي',
        value: data.serialNumber,
      });

      // Add back fields
      pass.backFields.push(
        {
          key: 'description',
          label: 'عن البطاقة',
          value: 'بطاقة هوية صحفية رسمية صادرة من منصة سبق الذكية',
        },
        {
          key: 'website',
          label: 'الموقع الإلكتروني',
          value: 'https://sabq.life',
        }
      );

      // Generate pass buffer
      const buffer = await pass.getAsBuffer();
      return buffer;
    } catch (error: any) {
      console.error('Error generating pass:', error);
      throw new Error(`Failed to generate pass: ${error.message}`);
    }
  }

  private translateRole(role: string): string {
    const roleMap: Record<string, string> = {
      admin: 'مدير',
      editor: 'محرر',
      journalist: 'صحفي',
      reporter: 'مراسل',
      reader: 'قارئ',
    };
    return roleMap[role] || role;
  }

  generateSerialNumber(userId: string): string {
    return `SABQ-${userId.substring(0, 8).toUpperCase()}`;
  }

  generateAuthToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const passKitService = new PassKitService();
