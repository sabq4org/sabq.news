import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

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
    clickUrl?: string;
  };
  campaign: {
    id: string;
    name: string;
  };
  impressionId?: string;
}

export function AdSlot({ slotId, className = "" }: AdSlotProps) {
  const { data: ad, isLoading, error } = useQuery<AdData>({
    queryKey: ["/api/ads/slot", slotId],
    enabled: !!slotId,
    refetchInterval: 60000, // Refresh every minute
    retry: false,
  });

  // Track impression
  useEffect(() => {
    if (ad?.impressionId) {
      // Send impression tracking
      fetch(`/api/ads/track/impression/${ad.impressionId}`, {
        method: "POST",
        credentials: "include",
      }).catch(console.error);
    }
  }, [ad?.impressionId]);

  const handleClick = () => {
    if (ad?.impressionId) {
      // Track click
      fetch(`/api/ads/track/click/${ad.impressionId}`, {
        method: "POST",
        credentials: "include",
      }).catch(console.error);
    }

    // Open ad URL if provided
    if (ad?.creative?.clickUrl) {
      window.open(ad.creative.clickUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-muted animate-pulse rounded ${className}`} data-testid={`ad-slot-loading-${slotId}`}>
        {/* Loading skeleton */}
      </div>
    );
  }

  if (error || !ad) {
    // No ad to show or error - return empty div
    return null;
  }

  const { creative } = ad;

  return (
    <div 
      className={`ad-slot ${className}`} 
      data-testid={`ad-slot-${slotId}`}
      data-campaign-id={ad.campaign.id}
      data-creative-id={creative.id}
    >
      {creative.type === "image" && (
        <a
          onClick={handleClick}
          className="block cursor-pointer"
          data-testid={`ad-link-${creative.id}`}
          rel="noopener noreferrer sponsored"
        >
          <img
            src={creative.content}
            alt={creative.name}
            className="w-full h-auto"
            loading="lazy"
            data-testid={`ad-image-${creative.id}`}
          />
        </a>
      )}

      {creative.type === "video" && (
        <div onClick={handleClick} className="cursor-pointer" data-testid={`ad-video-${creative.id}`}>
          <video
            src={creative.content}
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
          className="cursor-pointer"
          dangerouslySetInnerHTML={{ __html: creative.content }}
          data-testid={`ad-html-${creative.id}`}
        />
      )}
    </div>
  );
}
