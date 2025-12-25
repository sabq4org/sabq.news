import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

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
        className="native-ads-section py-6"
        dir="rtl"
        data-testid="native-ads-section-loading"
      >
        <div className="mb-4">
          <Skeleton className="h-8 w-32" />
        </div>
        {/* Desktop skeleton */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </Card>
          ))}
        </div>
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton className="w-20 h-14 rounded flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
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
      className="native-ads-section py-6"
      dir="rtl"
      data-testid="native-ads-section"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block text-xs text-muted-foreground/70"
          data-testid="native-ads-header"
        >
          شريك المحتوى
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* Desktop: Full card grid layout */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ads.map((ad) => (
          <Card
            key={ad.id}
            className="overflow-hidden hover-elevate cursor-pointer group"
            data-testid={`native-ad-card-${ad.id}`}
            onClick={() => handleAdClick(ad)}
          >
            <div className="aspect-video relative overflow-hidden bg-muted">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                data-testid={`native-ad-image-${ad.id}`}
              />
            </div>

            <div className="p-3 space-y-2">
              <h3
                className="font-semibold text-sm line-clamp-2 leading-relaxed"
                data-testid={`native-ad-title-${ad.id}`}
              >
                {ad.title}
              </h3>

              {ad.description && (
                <p
                  className="text-xs text-muted-foreground line-clamp-2"
                  data-testid={`native-ad-description-${ad.id}`}
                >
                  {ad.description}
                </p>
              )}

              <Button
                size="sm"
                variant="secondary"
                className="w-full justify-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdClick(ad);
                }}
                data-testid={`native-ad-cta-${ad.id}`}
              >
                <span>{ad.callToAction || "المزيد"}</span>
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div
                className="flex items-center gap-1 text-xs text-muted-foreground pt-1"
                data-testid={`native-ad-advertiser-${ad.id}`}
              >
                {ad.advertiserLogo && (
                  <img
                    src={ad.advertiserLogo}
                    alt={ad.advertiserName}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                )}
                <span className="flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  {ad.advertiserName}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Mobile: Compact horizontal list */}
      <div className="md:hidden space-y-2">
        {ads.map((ad) => (
          <article
            key={ad.id}
            className="flex gap-3 items-center p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
            data-testid={`native-ad-card-mobile-${ad.id}`}
            onClick={() => handleAdClick(ad)}
          >
            <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {ad.title}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[11px] text-muted-foreground/60">
                  {ad.advertiserName}
                </span>
                <ArrowLeft className="h-3 w-3 text-muted-foreground/40" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
