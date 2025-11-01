import { useState, useRef } from "react";
import { Paperclip, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'file';
  preview?: string;
}

interface FileUploadButtonProps {
  onFileUploaded: (file: UploadedFile) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${kb.toFixed(1)} KB`;
}

export function FileUploadButton({ onFileUploaded, disabled }: FileUploadButtonProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest<UploadedFile>('/api/chat/upload', {
        method: 'POST',
        body: formData,
        isFormData: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadProgress(percentCompleted);
        },
      });

      return response;
    },
    onSuccess: (data) => {
      onFileUploaded({
        ...data,
        preview: preview || undefined,
      });
      setSelectedFile(null);
      setPreview(null);
      setUploadProgress(0);
      toast({
        title: "تم رفع الملف بنجاح",
        description: `تم رفع ${data.name}`,
      });
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        variant: "destructive",
        title: "فشل رفع الملف",
        description: error.message || "حدث خطأ أثناء رفع الملف",
      });
    },
  });

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'نوع الملف غير مدعوم';
    }

    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    
    if (file.size > maxSize) {
      return isImage
        ? 'حجم الصورة كبير جداً. الحد الأقصى 5MB'
        : 'حجم الملف كبير جداً. الحد الأقصى 10MB';
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({
        variant: "destructive",
        title: "ملف غير صالح",
        description: error,
      });
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Auto-upload
    uploadMutation.mutate(file);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept={ALLOWED_TYPES.join(',')}
        disabled={disabled || uploadMutation.isPending}
        data-testid="input-file-upload"
      />

      {!selectedFile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          data-testid="button-file-upload"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      )}

      {selectedFile && (
        <div
          className="absolute bottom-full left-0 mb-2 bg-background border rounded-lg p-3 shadow-lg min-w-[280px]"
          data-testid="file-upload-preview"
        >
          <div className="flex items-start gap-3">
            {preview ? (
              <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  data-testid="image-preview"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="file-name">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="file-size">
                {formatFileSize(selectedFile.size)}
              </p>

              {uploadMutation.isPending && (
                <div className="mt-2" data-testid="upload-progress">
                  <Progress value={uploadProgress} className="h-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleCancel}
              disabled={uploadMutation.isPending}
              data-testid="button-cancel-upload"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
