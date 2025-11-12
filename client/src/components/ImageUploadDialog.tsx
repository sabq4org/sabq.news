import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageUploaded: (url: string) => void;
  onAllImagesUploaded?: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
}

interface UploadingFile {
  file: File;
  preview: string;
  progress: number;
  error?: string;
  uploaded?: boolean;
  url?: string;
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  onImageUploaded,
  onAllImagesUploaded,
  multiple = false,
  maxFiles = 5,
}: ImageUploadDialogProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    
    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "نوع ملف غير مسموح",
        description: "الأنواع المسموحة: JPG, PNG, GIF, WEBP",
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "حجم الملف كبير جداً",
        description: "الحد الأقصى لحجم الملف: 10MB",
      });
      return;
    }

    // Check max files limit
    if (!multiple && files.length > 1) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يمكنك اختيار صورة واحدة فقط",
      });
      return;
    }

    if (multiple && files.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "عدد كبير من الملفات",
        description: `الحد الأقصى: ${maxFiles} صور`,
      });
      return;
    }

    // Create preview URLs
    const newFiles: UploadingFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    setUploadingFiles(newFiles);
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFile = async (file: File, index: number): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadingFiles(prev => {
            const newFiles = [...prev];
            newFiles[index].progress = progress;
            return newFiles;
          });
        }
      });

      // Success handler
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploadingFiles(prev => {
              const newFiles = [...prev];
              newFiles[index].uploaded = true;
              newFiles[index].url = response.url;
              return newFiles;
            });
            resolve(response.url);
          } catch (error) {
            reject(new Error('فشل في معالجة الاستجابة'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.message || 'فشل في رفع الملف'));
          } catch {
            reject(new Error('فشل في رفع الملف'));
          }
        }
      });

      // Error handler
      xhr.addEventListener('error', () => {
        reject(new Error('فشل الاتصال بالخادم'));
      });

      xhr.open('POST', '/api/media/upload');
      xhr.send(formData);
    });
  };

  const handleUpload = async () => {
    if (uploadingFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Upload all files
      const uploadPromises = uploadingFiles.map((item, index) => 
        uploadFile(item.file, index)
      );

      const uploadedUrls = await Promise.all(uploadPromises);

      // Success notification
      toast({
        title: "تم رفع الصور بنجاح",
        description: `تم رفع ${uploadedUrls.length} صورة`,
      });

      // Insert images into editor
      if (onAllImagesUploaded) {
        // For gallery: send all URLs at once
        onAllImagesUploaded(uploadedUrls);
      } else {
        // For single images: send one by one
        uploadedUrls.forEach(url => onImageUploaded(url));
      }

      // Cleanup and close
      uploadingFiles.forEach(item => URL.revokeObjectURL(item.preview));
      setUploadingFiles([]);
      onOpenChange(false);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "فشل في رفع الصور",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
      });

      setUploadingFiles(prev => 
        prev.map(item => ({
          ...item,
          error: error instanceof Error ? error.message : "فشل الرفع",
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isUploading) {
      // Cleanup preview URLs
      uploadingFiles.forEach(item => URL.revokeObjectURL(item.preview));
      setUploadingFiles([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {multiple ? "رفع صور متعددة" : "رفع صورة"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File input area */}
          <div className="space-y-2">
            <Label>اختر الصور</Label>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple={multiple}
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-image-file"
              />
              <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                اضغط لاختيار {multiple ? "الصور" : "صورة"}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF, WEBP (حد أقصى 10MB)
              </p>
              {multiple && (
                <p className="text-xs text-muted-foreground mt-1">
                  يمكنك اختيار حتى {maxFiles} صور
                </p>
              )}
            </div>
          </div>

          {/* Preview grid */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {uploadingFiles.map((item, index) => (
                <div
                  key={index}
                  className="relative border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start gap-3">
                    {/* Preview image */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="h-16 w-16 object-cover rounded"
                      />
                      {item.uploaded && (
                        <div className="absolute inset-0 bg-green-500/20 rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {/* Progress bar */}
                      {item.progress > 0 && !item.uploaded && (
                        <div className="mt-2">
                          <Progress value={item.progress} className="h-1" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.progress}%
                          </p>
                        </div>
                      )}

                      {/* Error message */}
                      {item.error && (
                        <p className="text-xs text-destructive mt-1">
                          {item.error}
                        </p>
                      )}

                      {/* Success indicator */}
                      {item.uploaded && (
                        <p className="text-xs text-green-600 mt-1">
                          تم الرفع بنجاح
                        </p>
                      )}
                    </div>

                    {/* Remove button */}
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0"
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            disabled={isUploading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploadingFiles.length === 0 || isUploading}
            data-testid="button-upload-images"
          >
            {isUploading ? "جاري الرفع..." : "رفع (" + uploadingFiles.length + ")"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
