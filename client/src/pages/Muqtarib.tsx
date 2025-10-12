import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { AngleCard, AngleCardSkeleton } from "@/components/AngleCard";
import { useMuqtaribAngles } from "@/lib/muqtarib";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

export default function Muqtarib() {
  const { toast } = useToast();
  
  // Fetch current user
  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch angles for muqtarib section
  const { data: angles, isLoading, error } = useMuqtaribAngles("muqtarib");

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ في تحميل الزوايا",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Set page title and meta tags for SEO
  useEffect(() => {
    document.title = "مُقترب - سبق | زوايا متنوعة للأحداث والقضايا";
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'استكشف زوايا مُقترب المتنوعة - تحليلات عميقة ومنظورات فريدة للأحداث والقضايا المهمة في السعودية والعالم');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'استكشف زوايا مُقترب المتنوعة - تحليلات عميقة ومنظورات فريدة للأحداث والقضايا المهمة في السعودية والعالم';
      document.head.appendChild(meta);
    }

    // Set Open Graph tags
    const setOgTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    setOgTag('og:title', 'مُقترب - سبق | زوايا متنوعة للأحداث والقضايا');
    setOgTag('og:description', 'استكشف زوايا مُقترب المتنوعة - تحليلات عميقة ومنظورات فريدة للأحداث والقضايا المهمة');
    setOgTag('og:type', 'website');
  }, []);

  // Featured angle (first active angle)
  const featuredAngle = angles?.[0];
  const remainingAngles = angles?.slice(1) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {/* Hero skeleton */}
          <div className="text-center py-12" data-testid="section-hero-loading">
            <div className="h-12 w-48 bg-muted animate-pulse rounded mb-4 mx-auto" />
            <div className="h-6 w-96 max-w-full bg-muted animate-pulse rounded mx-auto" />
          </div>

          {/* Featured skeleton */}
          <div className="mb-12">
            <div className="h-8 w-36 bg-muted animate-pulse rounded mb-6" />
            <div className="max-w-4xl mx-auto">
              <AngleCardSkeleton />
            </div>
          </div>

          {/* Grid skeleton */}
          <div>
            <div className="h-8 w-36 bg-muted animate-pulse rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <AngleCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-destructive text-lg mb-4" data-testid="text-error">
              حدث خطأ في تحميل الزوايا
            </p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "خطأ غير معروف"}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!angles || angles.length === 0) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg" data-testid="text-empty">
              لا توجد زوايا متاحة حالياً
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center py-12" data-testid="section-hero">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-primary" data-testid="icon-sparkles" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold" data-testid="heading-title">
              مُقترب
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-tagline">
            زوايا متنوعة لفهم أعمق للأحداث والقضايا
          </p>
        </section>

        {/* Featured Angle Section */}
        {featuredAngle && (
          <section className="mb-12" data-testid="section-featured">
            <h2 className="text-2xl font-bold mb-6" data-testid="heading-featured">
              الزاوية المميزة
            </h2>
            <div className="max-w-4xl mx-auto">
              <AngleCard angle={featuredAngle} data-testid="card-featured-angle" />
            </div>
          </section>
        )}

        {/* Grid Section */}
        {remainingAngles.length > 0 && (
          <section data-testid="section-grid">
            <h2 className="text-2xl font-bold mb-6" data-testid="heading-explore">
              استكشف الزوايا
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-angles">
              {remainingAngles.map((angle) => (
                <AngleCard key={angle.id} angle={angle} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
