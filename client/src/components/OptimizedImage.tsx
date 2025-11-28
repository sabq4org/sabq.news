import { useState, useEffect, useRef, useMemo } from "react";
import { ImageOff } from "lucide-react";

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

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
  width?: number;
  height?: number;
  quality?: number;
  preferSize?: ImageSize;
}

const IMAGE_WIDTHS: Record<ImageSize, number> = {
  thumbnail: 150,
  small: 400,
  medium: 800,
  large: 1200,
  original: 0
};

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

// Build optimized image URL with query parameters for server-side optimization
function buildOptimizedUrl(src: string, options?: { 
  width?: number; 
  height?: number; 
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
}): string {
  if (!src) return src;
  
  // Only optimize images from public-objects (our storage)
  if (!src.includes('/public-objects/')) return src;
  
  // Already has optimization params
  if (src.includes('?w=') || src.includes('&w=')) return src;
  
  const params: string[] = [];
  if (options?.width) params.push(`w=${options.width}`);
  if (options?.height) params.push(`h=${options.height}`);
  if (options?.quality) params.push(`q=${options.quality}`);
  if (options?.format) params.push(`f=${options.format}`);
  
  if (params.length === 0) return src;
  
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}${params.join('&')}`;
}

// Generate srcSet for responsive images
function generateResponsiveSrcSet(src: string, preferredFormat: 'webp' | 'jpeg' = 'webp'): string {
  if (!src || !src.includes('/public-objects/')) return '';
  
  const widths = [400, 800, 1200, 1600];
  return widths
    .map(w => `${buildOptimizedUrl(src, { width: w, format: preferredFormat })} ${w}w`)
    .join(', ');
}

// Convert image URL to WebP using server-side optimization
function getOptimizedUrl(src: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  preferSize?: ImageSize;
}): string {
  if (!src) return src;
  
  // Only optimize public-objects images
  if (!src.includes('/public-objects/')) return src;
  
  // Check if this is already an optimized image format
  const isOptimizedFormat = /\.(webp|avif)$/i.test(src);
  
  // Calculate width based on preferred size
  let width = options?.width;
  if (!width && options?.preferSize && options.preferSize !== 'original') {
    width = IMAGE_WIDTHS[options.preferSize];
  }
  
  // Build the optimized URL with WebP format
  return buildOptimizedUrl(src, {
    width,
    height: options?.height,
    quality: options?.quality || 80,
    format: isOptimizedFormat ? undefined : 'webp'
  });
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
  width,
  height,
  quality,
  preferSize,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-generate optimized URL with WebP conversion
  const optimizedSrc = useMemo(() => {
    if (webpSrc) return webpSrc;
    return getOptimizedUrl(src, { width, height, quality, preferSize });
  }, [src, webpSrc, width, height, quality, preferSize]);
  
  // Auto-generate responsive srcSet if not provided
  const autoSrcSet = useMemo(() => {
    if (srcSet) return srcSet;
    return generateResponsiveSrcSet(src);
  }, [src, srcSet]);
  
  // Generate lightweight CSS gradient placeholder
  const gradientPlaceholder = useMemo(() => generateGradientPlaceholder(src), [src]);

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
    if (priority && optimizedSrc) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc;
      if (optimizedSrc.includes('f=webp') || optimizedSrc.endsWith('.webp')) {
        link.type = 'image/webp';
      }
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, optimizedSrc]);

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
      {/* Simple gradient placeholder - shows while main image loads */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 w-full h-full bg-muted/30"
          style={{
            background: gradientPlaceholder,
            backgroundSize: 'cover',
            backgroundPosition: objectPosition,
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Main image with progressive loading */}
      {isInView && (
        autoSrcSet ? (
          <picture className="contents">
            <source 
              srcSet={autoSrcSet} 
              type="image/webp"
              sizes={sizes}
            />
            <img
              src={optimizedSrc || src}
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
            src={optimizedSrc || src}
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
