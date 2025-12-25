import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface NativeAd {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  destinationUrl: string;
  callToAction: string | null;
  advertiserName: string;
  advertiserLogo: string | null;
  priority: number;
}

interface NativeAdsSectionProps {
  articleId?: string;
  categorySlug?: string;
  keywords?: string[];
  limit?: number;
}

function generateSessionId(): string {
  if (typeof window !== "undefined") {
    let sessionId = sessionStorage.getItem("native_ads_session");
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem("native_ads_session", sessionId);
    }
    return sessionId;
  }
  return `ssr-${Date.now()}`;
}

export function NativeAdsSection({
  articleId,
  categorySlug,
  keywords,
  limit = 4,
}: NativeAdsSectionProps) {
  const sessionId = useMemo(() => generateSessionId(), []);
  const trackedImpressions = useRef<Set<string>>(new Set());

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (categorySlug) params.append("category", categorySlug);
    if (keywords?.length) params.append("keyword", keywords[0]);
    params.append("limit", String(limit));
    return params.toString();
  }, [categorySlug, keywords, limit]);

  const { data: ads, isLoading } = useQuery<NativeAd[]>({
    queryKey: ["/api/native-ads/public", queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/native-ads/public?${queryParams}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch native ads");
      }
      return response.json();
    },
    staleTime: 60000,
    retry: false,
  });

  useEffect(() => {
    if (!ads?.length) return;

    ads.forEach((ad) => {
      if (trackedImpressions.current.has(ad.id)) return;
      trackedImpressions.current.add(ad.id);

      fetch(`/api/native-ads/${ad.id}/impression`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          articleId,
          sessionId,
        }),
      }).catch(console.error);
    });
  }, [ads, articleId, sessionId]);

  const handleAdClick = async (ad: NativeAd) => {
    try {
      await fetch(`/api/native-ads/${ad.id}/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          articleId,
          sessionId,
        }),
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }

    if (ad.destinationUrl) {
      window.open(ad.destinationUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <section
        className="native-ads-section py-4"
        dir="rtl"
        data-testid="native-ads-section-loading"
      >
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <Skeleton className="w-24 h-16 rounded flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!ads?.length) {
    return null;
  }

  return (
    <section
      className="native-ads-section py-4"
      dir="rtl"
      data-testid="native-ads-section"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block text-xs text-muted-foreground/60"
          data-testid="native-ads-header"
        >
          شريك المحتوى
        </span>
        <div className="flex-1 h-px bg-border/30" />
      </div>

      <div className="space-y-2">
        {ads.map((ad) => (
          <article
            key={ad.id}
            className="flex gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
            data-testid={`native-ad-card-${ad.id}`}
            onClick={() => handleAdClick(ad)}
          >
            {/* Thumbnail */}
            <div className="w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
                loading="lazy"
                data-testid={`native-ad-image-${ad.id}`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className="font-medium text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                  data-testid={`native-ad-title-${ad.id}`}
                >
                  {ad.title}
                </h3>
                <ExternalLink className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
              </div>

              <div className="flex items-center gap-2 mt-1">
                {ad.advertiserLogo && (
                  <img
                    src={ad.advertiserLogo}
                    alt={ad.advertiserName}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                )}
                <span
                  className="text-xs text-muted-foreground/70"
                  data-testid={`native-ad-advertiser-${ad.id}`}
                >
                  {ad.advertiserName}
                </span>
                {ad.callToAction && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-xs text-muted-foreground/70 flex items-center gap-1 group-hover:text-primary/70 transition-colors">
                      {ad.callToAction}
                      <ArrowLeft className="h-3 w-3" />
                    </span>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
