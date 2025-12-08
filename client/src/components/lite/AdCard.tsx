import { useCallback, useRef, useEffect } from "react";
import { ExternalLink } from "lucide-react";

interface AdData {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  ctaText?: string;
  linkUrl?: string;
  advertiser?: string;
}

interface AdCardProps {
  ad: AdData;
  position: 'current' | 'next' | 'previous';
  dragOffset: number;
  onDragStart: () => void;
  onDragMove: (offset: number) => void;
  onDragEnd: (velocity: number) => void;
}

export function AdCard({ 
  ad, 
  position, 
  dragOffset,
  onDragStart,
  onDragMove,
  onDragEnd 
}: AdCardProps) {
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (position !== 'current') return;
    startYRef.current = e.touches[0].clientY;
    lastYRef.current = e.touches[0].clientY;
    lastTimeRef.current = Date.now();
    isDraggingRef.current = true;
    onDragStart();
  }, [position, onDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || position !== 'current') return;
    const currentY = e.touches[0].clientY;
    const offset = currentY - startYRef.current;
    lastYRef.current = currentY;
    lastTimeRef.current = Date.now();
    onDragMove(offset);
  }, [position, onDragMove]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || position !== 'current') return;
    isDraggingRef.current = false;
    onDragEnd(0);
  }, [position, onDragEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (position !== 'current') return;
    startYRef.current = e.clientY;
    lastYRef.current = e.clientY;
    lastTimeRef.current = Date.now();
    isDraggingRef.current = true;
    onDragStart();
  }, [position, onDragStart]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || position !== 'current') return;
      const currentY = e.clientY;
      const offset = currentY - startYRef.current;
      lastYRef.current = currentY;
      lastTimeRef.current = Date.now();
      onDragMove(offset);
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current || position !== 'current') return;
      isDraggingRef.current = false;
      onDragEnd(0);
    };

    if (position === 'current') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, onDragMove, onDragEnd]);

  const getTransformY = () => {
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    if (position === 'current') {
      return dragOffset;
    } else if (position === 'next') {
      const baseOffset = screenHeight;
      const movement = Math.min(0, dragOffset);
      return baseOffset + movement;
    } else if (position === 'previous') {
      const baseOffset = -screenHeight;
      const movement = Math.max(0, dragOffset);
      return baseOffset + movement;
    }
    return 0;
  };

  const transformY = getTransformY();

  const handleAdClick = () => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="absolute inset-0 select-none"
      style={{ 
        transform: `translateY(${transformY}px)`,
        zIndex: position === 'current' ? 10 : 5,
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      data-testid={`ad-card-${ad.id}`}
    >
      <div className="h-full w-full overflow-hidden bg-black relative">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        <div 
          className="absolute inset-0" 
          style={{ 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%)' 
          }} 
        />

        <div className="absolute top-4 left-4 z-20">
          <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-white/80 text-xs font-medium">
            إعلان
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6" dir="rtl">
          {ad.advertiser && (
            <p className="text-white/60 text-sm mb-2">
              {ad.advertiser}
            </p>
          )}
          
          <h2 className="text-2xl font-bold text-white leading-tight mb-3">
            {ad.title}
          </h2>

          {ad.description && (
            <p className="text-white/75 text-base leading-relaxed mb-5 line-clamp-2">
              {ad.description}
            </p>
          )}

          {ad.linkUrl && (
            <button
              onClick={handleAdClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full px-8 py-3 text-base transition-colors flex items-center gap-2 mx-auto"
              data-testid="button-ad-cta"
            >
              {ad.ctaText || "اكتشف المزيد"}
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
