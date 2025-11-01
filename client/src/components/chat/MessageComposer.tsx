import { useState, useRef, useEffect } from "react";
import { Smile, Send, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MentionPicker } from "./MentionPicker";
import { FileUploadButton } from "./FileUploadButton";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";
import { AttachmentPreview } from "./AttachmentPreview";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useToxicityCheck } from "@/hooks/useToxicityCheck";

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'file';
  preview?: string;
}

interface MessageComposerProps {
  onSend: (content: string, attachments?: UploadedFile[], mentions?: string[]) => void;
  channelId?: string;
  placeholder?: string;
}

export function MessageComposer({
  onSend,
  channelId,
  placeholder = "اكتب رسالة...",
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [showToxicityWarning, setShowToxicityWarning] = useState(false);
  const [toxicityWarning, setToxicityWarning] = useState<{
    message: string;
    suggestion?: string;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { startTyping, stopTyping } = useTypingIndicator({
    channelId,
    debounceMs: 3000,
  });
  const { checkContent, isChecking } = useToxicityCheck();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const detectMentionTrigger = (text: string, cursorPosition: number) => {
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex === -1) return null;
    
    const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
    
    if (/\s/.test(textAfterAt)) return null;
    
    return {
      searchQuery: textAfterAt,
      startIndex: lastAtIndex,
    };
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (channelId && newContent.trim()) {
      startTyping();
    } else {
      stopTyping();
    }

    const cursorPosition = e.target.selectionStart;
    const mentionTrigger = detectMentionTrigger(newContent, cursorPosition);
    
    if (mentionTrigger) {
      setMentionSearch(mentionTrigger.searchQuery);
      setShowMentionPicker(true);
    } else {
      setShowMentionPicker(false);
      setMentionSearch("");
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const cursorPosition = textareaRef.current?.selectionStart || content.length;
    const newContent =
      content.slice(0, cursorPosition) +
      emoji +
      content.slice(cursorPosition);
    setContent(newContent);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileUploaded = (file: UploadedFile) => {
    setAttachments((prev) => [...prev, file]);
  };

  const handleVoiceNoteSent = (data: { url: string; duration: number; size: number }) => {
    const voiceNote: UploadedFile = {
      url: data.url,
      name: `Voice Note - ${new Date().toLocaleTimeString('ar-SA')}`,
      size: data.size,
      mimeType: 'audio/webm',
      type: 'audio',
    };
    setAttachments((prev) => [...prev, voiceNote]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMentionSelect = (username: string, userId: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || content.length;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const newContent =
        content.slice(0, lastAtIndex + 1) +
        username +
        " " +
        content.slice(cursorPosition);
      setContent(newContent);
      
      if (!mentions.includes(username)) {
        setMentions([...mentions, username]);
      }
      
      setShowMentionPicker(false);
      setMentionSearch("");
      
      setTimeout(() => {
        textareaRef.current?.focus();
        const newPosition = lastAtIndex + username.length + 2;
        textareaRef.current?.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const handleSend = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent && attachments.length === 0) return;

    const toxicityResult = await checkContent(trimmedContent);
    
    if (!toxicityResult.allowed) {
      setToxicityWarning({
        message: toxicityResult.message || 'هذه الرسالة قد تحتوي على محتوى غير لائق',
        suggestion: toxicityResult.suggestion,
      });
      setShowToxicityWarning(true);
      return;
    }

    stopTyping();

    onSend(trimmedContent, attachments, mentions.length > 0 ? mentions : undefined);
    setContent("");
    setAttachments([]);
    setMentions([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleForceSend = () => {
    const trimmedContent = content.trim();
    stopTyping();
    onSend(trimmedContent, attachments, mentions.length > 0 ? mentions : undefined);
    setContent("");
    setAttachments([]);
    setMentions([]);
    setShowToxicityWarning(false);
    setToxicityWarning(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleUseSuggestion = () => {
    if (toxicityWarning?.suggestion) {
      setContent(toxicityWarning.suggestion);
    }
    setShowToxicityWarning(false);
    setToxicityWarning(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-3" dir="rtl">
      {attachments.length > 0 && (
        <AttachmentPreview
          attachments={attachments}
          onRemove={handleRemoveAttachment}
          variant="compact"
        />
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="resize-none min-h-[44px] max-h-[200px] pr-3"
            rows={1}
            data-testid="input-message"
          />
          {channelId && (
            <MentionPicker
              channelId={channelId}
              open={showMentionPicker}
              onOpenChange={setShowMentionPicker}
              onSelect={handleMentionSelect}
              searchQuery={mentionSearch}
            />
          )}
        </div>

        <div className="flex items-center gap-1">
          <FileUploadButton
            onFileUploaded={handleFileUploaded}
            disabled={false}
          />

          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-0"
              align="end"
              data-testid="emoji-picker"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                searchPlaceHolder="بحث..."
                previewConfig={{ showPreview: false }}
              />
            </PopoverContent>
          </Popover>

          <VoiceNoteRecorder
            onVoiceNoteSent={handleVoiceNoteSent}
            disabled={false}
          />

          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            disabled={(!content.trim() && attachments.length === 0) || isChecking}
            data-testid="button-send"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" data-testid="loading-icon" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        اضغط Enter للإرسال، Shift+Enter لسطر جديد
      </p>

      <AlertDialog open={showToxicityWarning} onOpenChange={setShowToxicityWarning}>
        <AlertDialogContent dir="rtl" data-testid="toxicity-warning-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              تحذير: محتوى غير مناسب
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toxicityWarning?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {toxicityWarning?.suggestion && (
            <div className="p-3 bg-muted rounded-md space-y-2">
              <p className="text-sm font-medium">بديل مقترح:</p>
              <p className="text-sm" data-testid="toxicity-suggestion">
                {toxicityWarning.suggestion}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-send">
              إلغاء
            </AlertDialogCancel>
            {toxicityWarning?.suggestion && (
              <Button
                variant="outline"
                onClick={handleUseSuggestion}
                data-testid="button-use-suggestion"
              >
                استخدام البديل
              </Button>
            )}
            <AlertDialogAction
              onClick={handleForceSend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-force-send"
            >
              إرسال على أي حال
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
