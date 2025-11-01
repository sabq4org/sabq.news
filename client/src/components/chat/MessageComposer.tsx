import { useState, useRef, useEffect } from "react";
import { Paperclip, Smile, Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageComposerProps {
  onSend: (content: string, attachments?: File[]) => void;
  onTyping?: () => void;
  placeholder?: string;
}

export function MessageComposer({
  onSend,
  onTyping,
  placeholder = "اكتب رسالة...",
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {
        // Stop typing indicator
      }, 1000);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent && attachments.length === 0) return;

    onSend(trimmedContent, attachments);
    setContent("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceNote = () => {
    console.log("Voice note recording");
    // Implementation for voice recording
  };

  return (
    <div className="space-y-3" dir="rtl">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="attachments-preview">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md text-sm"
              data-testid={`attachment-preview-${index}`}
            >
              <span className="truncate max-w-[200px]">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => handleRemoveAttachment(index)}
                data-testid={`button-remove-attachment-${index}`}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
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
        </div>

        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            data-testid="input-file"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-attach"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

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

          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceNote}
            data-testid="button-voice"
          >
            <Mic className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            disabled={!content.trim() && attachments.length === 0}
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        اضغط Enter للإرسال، Shift+Enter لسطر جديد
      </p>
    </div>
  );
}
