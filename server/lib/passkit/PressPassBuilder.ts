import { PassBuilder, PressPassData } from './PassBuilder';
import { PKPass } from 'passkit-generator';
import path from 'path';

export class PressPassBuilder extends PassBuilder {
  constructor(passTypeId: string, teamId: string) {
    super(passTypeId, teamId);
  }
  
  getTemplatePath(): string {
    return path.resolve(__dirname, './pass-template');
  }
  
  getPassDescription(): string {
    return 'Sabq Smart Press Card';
  }
  
  getOrganizationName(): string {
    return 'سبق الذكية';
  }
  
  protected getBackgroundColor(): string {
    return 'rgb(0, 122, 255)';
  }
  
  configurePassFields(pass: PKPass, data: PressPassData): void {
    pass.headerFields.push({
      key: 'role',
      label: 'الدور',
      value: this.translateRole(data.userRole),
    });
    
    pass.primaryFields.push({
      key: 'name',
      label: 'الاسم',
      value: data.userName,
    });
    
    if (data.jobTitle) {
      pass.secondaryFields.push({
        key: 'job_title',
        label: 'المنصب',
        value: data.jobTitle,
      });
    }
    
    if (data.department) {
      pass.secondaryFields.push({
        key: 'department',
        label: 'القسم',
        value: data.department,
      });
    }
    
    if (data.pressIdNumber) {
      pass.auxiliaryFields.push({
        key: 'press_id',
        label: 'رقم البطاقة الصحفية',
        value: data.pressIdNumber,
      });
    }
    
    if (data.validUntil) {
      pass.auxiliaryFields.push({
        key: 'valid_until',
        label: 'صالحة حتى',
        value: data.validUntil.toLocaleDateString('ar-SA'),
      });
    }
    
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
}
