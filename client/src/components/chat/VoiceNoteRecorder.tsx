import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceNoteRecorderProps {
  onVoiceNoteSent: (data: { url: string; duration: number; size: number }) => void;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function VoiceNoteRecorder({ onVoiceNoteSent, disabled }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const formData = new FormData();
      formData.append('audio', blob, `voice-note-${Date.now()}.webm`);
      formData.append('duration', duration.toString());

      const response = await apiRequest<{ url: string; duration: number; size: number }>(
        '/api/chat/upload/voice',
        {
          method: 'POST',
          body: formData,
          isFormData: true,
        }
      );

      return response;
    },
    onSuccess: (data) => {
      onVoiceNoteSent(data);
      handleCancel();
      toast({
        title: "تم إرسال الملاحظة الصوتية",
        description: `المدة: ${formatDuration(data.duration)}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "فشل إرسال الملاحظة الصوتية",
        description: error.message || "حدث خطأ أثناء الإرسال",
      });
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          // Auto-stop at 2 minutes
          if (newDuration >= 120) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: "destructive",
        title: "فشل الوصول إلى الميكروفون",
        description: "يرجى السماح بالوصول إلى الميكروفون",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    
    setRecordedBlob(null);
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    audioChunksRef.current = [];
  };

  const handleSend = () => {
    if (recordedBlob) {
      uploadMutation.mutate(recordedBlob);
    }
  };

  // Show recording UI
  if (isRecording || recordedBlob) {
    return (
      <div
        className="absolute bottom-full left-0 mb-2 bg-background border rounded-lg p-4 shadow-lg min-w-[300px]"
        data-testid="voice-recorder-panel"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isRecording && (
                <div
                  className="w-2 h-2 bg-destructive rounded-full animate-pulse"
                  data-testid="recording-indicator"
                />
              )}
              <span
                className="text-lg font-mono font-medium"
                data-testid="recording-duration"
              >
                {formatDuration(duration)}
              </span>
            </div>

            {isRecording && (
              <Button
                variant="ghost"
                size="icon"
                onClick={stopRecording}
                data-testid="button-stop-recording"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            )}
          </div>

          {recordedBlob && audioUrl && (
            <div data-testid="audio-preview">
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="w-full"
                data-testid="audio-player"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={uploadMutation.isPending}
              className="flex-1"
              data-testid="button-cancel-recording"
            >
              <Trash2 className="h-4 w-4 ml-1" />
              إلغاء
            </Button>

            {recordedBlob && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSend}
                disabled={uploadMutation.isPending}
                className="flex-1"
                data-testid="button-send-voice"
              >
                <Send className="h-4 w-4 ml-1" />
                {uploadMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show mic button
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={startRecording}
      disabled={disabled}
      data-testid="button-start-recording"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
