import { useState } from "react";
import { Download, Play, Pause, FileText, File as FileIcon, Image as ImageIcon, Video, Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Attachment {
  id?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'file';
  url: string;
  name: string;
  size?: number;
}

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove?: (index: number) => void;
  variant?: 'compact' | 'full';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const kb = bytes / 1024;
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${kb.toFixed(1)} KB`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getFileIcon(type: string) {
  switch (type) {
    case 'image':
      return ImageIcon;
    case 'video':
      return Video;
    case 'audio':
      return Music;
    case 'document':
      return FileText;
    default:
      return FileIcon;
  }
}

export function AttachmentPreview({ 
  attachments, 
  onRemove,
  variant = 'full' 
}: AttachmentPreviewProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <>
      <div
        className={cn(
          "space-y-2",
          variant === 'compact' ? "max-w-md" : "w-full"
        )}
        data-testid="attachments-container"
      >
        {attachments.map((attachment, index) => (
          <div
            key={attachment.id || index}
            className="relative group"
            data-testid={`attachment-${index}`}
          >
            {attachment.type === 'image' && (
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-full max-h-64 object-cover cursor-pointer hover-elevate"
                  onClick={() => setLightboxImage(attachment.url)}
                  data-testid={`image-${index}`}
                />
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  {onRemove && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRemove(index)}
                      data-testid={`button-remove-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 mr-auto"
                    onClick={() => handleDownload(attachment.url, attachment.name)}
                    data-testid={`button-download-${index}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {attachment.type === 'video' && (
              <div className="rounded-lg overflow-hidden border" data-testid={`video-${index}`}>
                <video
                  src={attachment.url}
                  controls
                  className="w-full max-h-64"
                />
              </div>
            )}

            {attachment.type === 'audio' && (
              <div
                className="flex items-center gap-3 p-3 bg-muted rounded-lg border"
                data-testid={`audio-${index}`}
              >
                <div className="flex-shrink-0">
                  <Music className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <audio
                    src={attachment.url}
                    controls
                    className="w-full"
                    data-testid={`audio-player-${index}`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(attachment.url, attachment.name)}
                  data-testid={`button-download-audio-${index}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}

            {(attachment.type === 'document' || attachment.type === 'file') && (
              <div
                className="flex items-center gap-3 p-3 bg-muted rounded-lg border hover-elevate"
                data-testid={`file-${index}`}
              >
                {(() => {
                  const Icon = getFileIcon(attachment.type);
                  return <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />;
                })()}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    data-testid={`file-name-${index}`}
                  >
                    {attachment.name}
                  </p>
                  {attachment.size && (
                    <p
                      className="text-xs text-muted-foreground"
                      data-testid={`file-size-${index}`}
                    >
                      {formatFileSize(attachment.size)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(index)}
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(attachment.url, attachment.name)}
                    data-testid={`button-download-file-${index}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-0" data-testid="lightbox">
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Full size"
              className="w-full h-auto"
              data-testid="lightbox-image"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
