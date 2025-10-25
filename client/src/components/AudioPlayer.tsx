import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  newsletterId: string;
  audioUrl: string;
  title: string;
  duration?: number;
  autoPlay?: boolean;
  className?: string;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({
  newsletterId,
  audioUrl,
  title,
  duration: propDuration,
  autoPlay = false,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(!propDuration); // Only loading if no duration provided
  const [hasTrackedListen, setHasTrackedListen] = useState(false);

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Track listen event after 5 seconds of playback
  useEffect(() => {
    if (isPlaying && currentTime >= 5 && !hasTrackedListen) {
      trackListenEvent();
      setHasTrackedListen(true);
    }
  }, [isPlaying, currentTime, hasTrackedListen]);

  const trackListenEvent = async () => {
    try {
      await apiRequest(`/api/audio-newsletters/${newsletterId}/listen`, {
        method: "POST",
        body: JSON.stringify({
          duration: Math.floor(currentTime),
          completionRate: duration > 0 ? (currentTime / duration) * 100 : 0,
        }),
      });
    } catch (error) {
      console.error("Failed to track listen event:", error);
    }
  };

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Track completion
      trackListenEvent();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (autoPlay) {
        audio.play().catch(console.error);
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, [autoPlay]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  if (isLoading && !duration) {
    return (
      <div className={cn("w-full space-y-4 p-4 border rounded-lg", className)} dir="rtl">
        <Skeleton className="h-10 w-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full p-4 border rounded-lg bg-card space-y-4",
        className
      )}
      dir="rtl"
      role="region"
      aria-label={`مشغل صوتي لـ ${title}`}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Title */}
      <div className="text-sm font-medium truncate" data-testid="text-audio-title">
        {title}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleProgressChange}
          className="cursor-pointer"
          dir="ltr"
          data-testid="slider-progress"
          aria-label="شريط التقدم"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid="text-current-time">{formatTime(currentTime)}</span>
          <span data-testid="text-duration">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <Button
          size="icon"
          variant="default"
          onClick={togglePlayPause}
          disabled={isLoading}
          className="h-10 w-10"
          data-testid="button-play-pause"
          aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        {/* Skip Backward */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => skipTime(-10)}
          className="h-9 w-9"
          data-testid="button-skip-backward"
          aria-label="العودة 10 ثواني"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Skip Forward */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => skipTime(10)}
          className="h-9 w-9"
          data-testid="button-skip-forward"
          aria-label="التقدم 10 ثواني"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        {/* Playback Speed */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-3"
              data-testid="button-playback-speed"
              aria-label={`سرعة التشغيل: ${playbackSpeed}x`}
            >
              {playbackSpeed}x
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PLAYBACK_SPEEDS.map((speed) => (
              <DropdownMenuItem
                key={speed}
                onClick={() => changePlaybackSpeed(speed)}
                data-testid={`menuitem-speed-${speed}`}
                className={playbackSpeed === speed ? "bg-accent" : ""}
              >
                {speed}x
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className="h-9 w-9"
            data-testid="button-mute-toggle"
            aria-label={isMuted ? "إلغاء الكتم" : "كتم الصوت"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20 cursor-pointer"
            dir="ltr"
            data-testid="slider-volume"
            aria-label="مستوى الصوت"
          />
        </div>
      </div>
    </div>
  );
}
