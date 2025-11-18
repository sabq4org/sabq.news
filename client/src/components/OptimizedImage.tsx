import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  objectPosition?: string;
  priority?: boolean;
  aspectRatio?: string;
  fallbackGradient?: string;
  webpSrc?: string;
  blurDataUrl?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  objectPosition = "center",
  priority = false,
  aspectRatio,
  fallbackGradient = "from-primary/10 to-accent/10",
  webpSrc,
  blurDataUrl,
  threshold = 0.1,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px",
        threshold: [0, threshold, 0.5, 1],
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br ${fallbackGradient} ${className}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <ImageOff className="h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!isLoaded && (
        <Skeleton
          className="absolute inset-0"
          style={aspectRatio ? { aspectRatio } : undefined}
        />
      )}
      
      {blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ 
            objectPosition,
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
          aria-hidden="true"
        />
      )}
      
      {isInView && (
        webpSrc ? (
          <picture className="contents">
            <source srcSet={webpSrc} type="image/webp" />
            <img
              src={src}
              alt={alt}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ objectPosition }}
              loading={priority ? "eager" : "lazy"}
              onLoad={handleLoad}
              onError={handleError}
              decoding="async"
            />
          </picture>
        ) : (
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ objectPosition }}
            loading={priority ? "eager" : "lazy"}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
          />
        )
      )}
    </div>
  );
}
