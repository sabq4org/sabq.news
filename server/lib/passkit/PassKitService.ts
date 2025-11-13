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
    const certPath = process.env.APPLE_PASS_CERT;
    const keyPath = process.env.APPLE_PASS_KEY;
    const wwdrPath = process.env.APPLE_WWDR_CERT;

    if (!certPath || !keyPath) {
      throw new Error(
        'تعذر إصدار البطاقة لأن بيانات الاعتماد الخاصة بـ Apple Wallet غير مكتملة. يرجى التواصل مع المسؤول.'
      );
    }

    try {
      // Determine if env vars are file paths or base64-encoded content
      const loadCertificate = (envVar: string): Buffer | string => {
        // If it looks like a file path, return the path (library will load it)
        if (envVar.startsWith('/') || envVar.startsWith('./') || envVar.includes('\\')) {
          return envVar;
        }
        
        // If it looks like base64, decode it
        if (envVar.match(/^[A-Za-z0-9+/=]+$/)) {
          return Buffer.from(envVar, 'base64');
        }
        
        // Otherwise, assume it's raw PEM content
        return Buffer.from(envVar, 'utf-8');
      };

      const certificates: any = {
        signerCert: loadCertificate(certPath),
        signerKey: loadCertificate(keyPath),
      };

      // Add WWDR cert if provided
      if (wwdrPath) {
        certificates.wwdr = loadCertificate(wwdrPath);
      }

      // Add key password if provided
      if (process.env.APPLE_PASS_KEY_PASSWORD) {
        certificates.signerKeyPassphrase = process.env.APPLE_PASS_KEY_PASSWORD;
      }

      // Create pass instance
      const pass = new PKPass(
        {
          // Model path
          model: path.resolve(__dirname, './pass-template'),
          
          // Certificates
          certificates,
        },
        {
          // Pass metadata
          serialNumber: data.serialNumber,
          description: 'Sabq Smart Press Card',
          organizationName: 'سبق الذكية',
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
      
      // Provide more helpful error messages
      if (error.message?.includes('PEM')) {
        throw new Error('خطأ في شهادات Apple. يرجى التحقق من تنسيق ملفات الشهادات.');
      }
      
      throw new Error(`تعذر إنشاء البطاقة: ${error.message}`);
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
