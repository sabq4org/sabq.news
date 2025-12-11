import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useCallback } from "react";

interface AdSlotProps {
  slotId: string;
  className?: string;
}

interface AdData {
  creative: {
    id: string;
    name: string;
    type: "image" | "video" | "html";
    content: string;
    size: string;
    destinationUrl: string;
  };
  campaign: {
    id: string;
    name: string;
  };
  impressionId: string;
  priority: number;
}

interface AdSlotResponse {
  ads: AdData[];
  rotationIntervalMs: number;
  totalAds: number;
}

function getDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  
  const width = window.innerWidth;
  
  if (width < 768) {
    return "mobile";
  } else if (width < 1024) {
    return "tablet";
  } else {
    return "desktop";
  }
}

export function AdSlot({ slotId, className = "" }: AdSlotProps) {
  const deviceType = useMemo(() => getDeviceType(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trackedImpressions, setTrackedImpressions] = useState<Set<string>>(new Set());

  const { data: response, isLoading, error } = useQuery<AdSlotResponse>({
    queryKey: ["/api/ads/slot", slotId, deviceType],
    queryFn: async () => {
      const res = await fetch(`/api/ads/slot/${slotId}?deviceType=${deviceType}`, {
        credentials: "include",
      });
      
      if (res.status === 204) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error("Failed to fetch ads");
      }
      
      return res.json();
    },
    enabled: !!slotId,
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: false,
  });

  const ads = response?.ads || [];
  const rotationInterval = response?.rotationIntervalMs || 10000;
  const currentAd = ads[currentIndex];

  // Track impression when ad is displayed
  const trackImpression = useCallback((impressionId: string) => {
    if (trackedImpressions.has(impressionId)) return;
    
    fetch(`/api/ads/track/impression/${impressionId}`, {
      method: "POST",
      credentials: "include",
    }).catch(console.error);
    
    setTrackedImpressions(prev => new Set(prev).add(impressionId));
  }, [trackedImpressions]);

  // Track impression for current ad
  useEffect(() => {
    if (currentAd?.impressionId) {
      trackImpression(currentAd.impressionId);
    }
  }, [currentAd?.impressionId, trackImpression]);

  // Rotate ads automatically
  useEffect(() => {
    if (ads.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, rotationInterval);
    
    return () => clearInterval(timer);
  }, [ads.length, rotationInterval]);

  // Reset index when ads change
  useEffect(() => {
    setCurrentIndex(0);
    setTrackedImpressions(new Set());
  }, [slotId]);

  const handleClick = useCallback(() => {
    if (!currentAd) return;
    
    // Track click
    if (currentAd.impressionId) {
      fetch(`/api/ads/track/click/${currentAd.impressionId}`, {
        method: "POST",
        credentials: "include",
      }).catch(console.error);
    }

    // Open ad URL
    if (currentAd.creative?.destinationUrl) {
      window.open(currentAd.creative.destinationUrl, "_blank", "noopener,noreferrer");
    }
  }, [currentAd]);

  if (isLoading) {
    return (
      <div className={`bg-muted animate-pulse rounded ${className}`} data-testid={`ad-slot-loading-${slotId}`} />
    );
  }

  if (error || !currentAd) {
    return null;
  }

  const { creative } = currentAd;
  const parsedSize = creative.size?.split('x')?.map(Number) ?? [728, 90];
  const width = isNaN(parsedSize[0]) ? 728 : parsedSize[0];
  const height = isNaN(parsedSize[1]) ? 90 : parsedSize[1];

  return (
    <div 
      className={`ad-slot relative ${className}`} 
      data-testid={`ad-slot-${slotId}`}
      data-campaign-id={currentAd.campaign.id}
      data-creative-id={creative.id}
      data-total-ads={ads.length}
    >
      {creative.type === "image" && (
        <a
          href={creative.destinationUrl}
          onClick={(e) => {
            e.preventDefault();
            handleClick();
          }}
          className="block cursor-pointer mx-auto rounded-md overflow-hidden border border-border/50 bg-card/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
          style={{ maxWidth: `${width}px` }}
          data-testid={`ad-link-${creative.id}`}
          rel="noopener noreferrer sponsored"
          target="_blank"
        >
          <img
            src={creative.content}
            alt={creative.name}
            width={width}
            height={height}
            className="w-full h-auto transition-opacity duration-500"
            loading="lazy"
            data-testid={`ad-image-${creative.id}`}
          />
        </a>
      )}

      {creative.type === "video" && (
        <div 
          onClick={handleClick} 
          className="cursor-pointer mx-auto" 
          style={{ maxWidth: `${width}px` }}
          data-testid={`ad-video-${creative.id}`}
        >
          <video
            src={creative.content}
            width={width}
            height={height}
            className="w-full h-auto"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      )}

      {creative.type === "html" && (
        <div
          onClick={handleClick}
          className="cursor-pointer mx-auto"
          style={{ maxWidth: `${width}px` }}
          dangerouslySetInnerHTML={{ __html: creative.content }}
          data-testid={`ad-html-${creative.id}`}
        />
      )}

      {/* Rotation indicator dots */}
      {ads.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2" data-testid="ad-rotation-dots">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? "bg-primary scale-110" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`عرض الإعلان ${index + 1}`}
              data-testid={`ad-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
