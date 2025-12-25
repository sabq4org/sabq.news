import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
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
        className="native-ads-section py-3"
        dir="rtl"
        data-testid="native-ads-section-loading"
      >
        <div className="space-y-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-2">
              <Skeleton className="h-3 w-3/4" />
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
      className="native-ads-section py-3"
      dir="rtl"
      data-testid="native-ads-section"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-block text-[10px] text-muted-foreground/50 uppercase tracking-wide"
          data-testid="native-ads-header"
        >
          شريك المحتوى
        </span>
        <div className="flex-1 h-px bg-border/20" />
      </div>

      <div className="divide-y divide-border/20">
        {ads.map((ad) => (
          <article
            key={ad.id}
            className="py-2 cursor-pointer group"
            data-testid={`native-ad-card-${ad.id}`}
            onClick={() => handleAdClick(ad)}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] text-muted-foreground/50"
                data-testid={`native-ad-advertiser-${ad.id}`}
              >
                {ad.advertiserName}
              </span>
              <span className="text-muted-foreground/30">|</span>
              <h3
                className="flex-1 text-xs font-normal text-foreground/80 group-hover:text-primary transition-colors line-clamp-1"
                data-testid={`native-ad-title-${ad.id}`}
              >
                {ad.title}
              </h3>
              <ArrowLeft className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary/60 transition-colors flex-shrink-0" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
