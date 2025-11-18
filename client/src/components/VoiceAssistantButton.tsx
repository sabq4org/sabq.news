import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useVoiceAssistant } from "@/contexts/VoiceAssistantContext";
import { cn } from "@/lib/utils";

type VoiceAssistantButtonProps = {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
};

/**
 * VoiceAssistantButton - Floating button to control voice assistant
 * 
 * Features:
 * - Start/stop voice recognition
 * - Visual feedback for listening/speaking states
 * - Accessible keyboard controls
 * - Tooltip with status
 */
export function VoiceAssistantButton({
  className,
  variant = "default",
  size = "icon",
}: VoiceAssistantButtonProps) {
  const {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceAssistant();

  if (!isSupported) {
    return null; // Don't render if browser doesn't support voice
  }

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getTooltipText = () => {
    if (isListening) return "جاري الاستماع... اضغط للإيقاف";
    if (isSpeaking) return "جاري القراءة...";
    return "اضغط للتحدث";
  };

  const getIcon = () => {
    if (isSpeaking) return <Volume2 className="h-4 w-4" />;
    if (isListening) return <Mic className="h-4 w-4 animate-pulse" />;
    return <MicOff className="h-4 w-4" />;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          disabled={isSpeaking}
          className={cn(
            "transition-all",
            isListening && "ring-2 ring-primary ring-offset-2",
            isSpeaking && "opacity-50 cursor-not-allowed",
            className
          )}
          aria-label={getTooltipText()}
          aria-pressed={isListening}
          data-testid="button-voice-assistant"
        >
          {getIcon()}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{getTooltipText()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
