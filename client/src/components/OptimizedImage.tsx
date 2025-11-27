import { useState, useEffect, useRef, useMemo } from "react";
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
  sizes?: string;
  srcSet?: string;
  fetchPriority?: "high" | "low" | "auto";
  onLoad?: () => void;
  onError?: () => void;
}

// Generate CSS gradient placeholder based on dominant color or fallback
// This is lightweight and doesn't require fetching any additional resources
function generateGradientPlaceholder(src: string): string {
  // Create a subtle gradient placeholder based on src hash for consistency
  if (!src) return 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground)/0.1) 100%)';
  
  // Simple hash for consistent color per image
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = ((hash << 5) - hash) + src.charCodeAt(i);
    hash |= 0;
  }
  
  // Generate subtle gradient based on hash
  const hue = Math.abs(hash) % 360;
  const saturation = 5 + (Math.abs(hash >> 8) % 10); // Very low saturation
  const lightness = 85 + (Math.abs(hash >> 16) % 10); // High lightness
  
  return `linear-gradient(135deg, hsl(${hue} ${saturation}% ${lightness}%) 0%, hsl(${hue} ${saturation}% ${lightness - 5}%) 100%)`;
}

// Convert image URL to WebP if supported
function getWebpUrl(src: string): string | null {
  if (!src) return null;
  // Already WebP
  if (src.endsWith('.webp')) return null;
  // Try WebP version
  if (src.includes('/public-objects/')) {
    return src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  }
  return null;
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
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  srcSet,
  fetchPriority = "auto",
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-detect WebP and generate gradient placeholder
  const autoWebpSrc = useMemo(() => webpSrc || getWebpUrl(src), [src, webpSrc]);
  // Use provided blurDataUrl (base64) or generate lightweight CSS gradient
  const gradientPlaceholder = useMemo(() => generateGradientPlaceholder(src), [src]);
  // Only use actual blur data URL if provided, otherwise use CSS gradient
  const hasBlurDataUrl = !!blurDataUrl;

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Check if IntersectionObserver is available
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

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
        rootMargin: "300px", // Increased for earlier loading
        threshold: [0, threshold, 0.5, 1],
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [priority, threshold]);

  // Preload high-priority images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = autoWebpSrc || src;
      if (autoWebpSrc) {
        link.type = 'image/webp';
      }
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src, autoWebpSrc]);

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

  const imageStyles = {
    objectPosition,
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Gradient/blur placeholder - shows while main image loads */}
      {!isLoaded && (
        <>
          {/* Base gradient layer */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              background: hasBlurDataUrl 
                ? `url(${blurDataUrl})` 
                : gradientPlaceholder,
              backgroundSize: 'cover',
              backgroundPosition: objectPosition,
              filter: hasBlurDataUrl ? 'blur(10px)' : 'none',
              transform: hasBlurDataUrl ? 'scale(1.05)' : 'none',
            }}
            aria-hidden="true"
          />
          {/* Shimmer overlay for progressive loading effect */}
          {!hasBlurDataUrl && (
            <div 
              className="absolute inset-0 w-full h-full overflow-hidden"
              aria-hidden="true"
            >
              <div 
                className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                }}
              />
            </div>
          )}
        </>
      )}
      
      {/* Main image with progressive loading */}
      {isInView && (
        autoWebpSrc ? (
          <picture className="contents">
            <source 
              srcSet={srcSet || autoWebpSrc} 
              type="image/webp"
              sizes={sizes}
            />
            <img
              src={src}
              alt={alt}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={imageStyles}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : fetchPriority}
              onLoad={handleLoad}
              onError={handleError}
              decoding="async"
              sizes={sizes}
            />
          </picture>
        ) : (
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={imageStyles}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : fetchPriority}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
            srcSet={srcSet}
            sizes={sizes}
          />
        )
      )}
    </div>
  );
}

// Export a simpler version for quick use
export function QuickImage({ 
  src, 
  alt, 
  className = "" 
}: { 
  src: string; 
  alt: string; 
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      aspectRatio="16/9"
    />
  );
}
