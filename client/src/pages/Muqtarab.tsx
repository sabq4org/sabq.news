import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useMuqtarabAngles } from "@/lib/muqtarab";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Circle, ArrowLeft, Sparkles, BookOpen, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function getIconComponent(iconKey: string) {
  const iconName = iconKey as keyof typeof LucideIcons;
  const IconComponent = LucideIcons[iconName];
  if (IconComponent && typeof IconComponent === 'function') {
    return IconComponent as React.ComponentType<{ className?: string }>;
  }
  return Circle;
}

export default function Muqtarab() {
  const { toast } = useToast();
  const [hoveredAngle, setHoveredAngle] = useState<string | null>(null);
  
  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: angles, isLoading, error } = useMuqtarabAngles("muqtarab");

  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ في تحميل الزوايا",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    document.title = "مُقترب - سبق | زوايا متنوعة للأحداث والقضايا";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'استكشف زوايا مُقترب المتنوعة - تحليلات عميقة ومنظورات فريدة للأحداث والقضايا المهمة');
    }
  }, []);

  const featuredAngle = angles?.[0];
  const secondaryAngles = angles?.slice(1, 3) || [];
  const remainingAngles = angles?.slice(3) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} />
        <main className="relative">
          <div className="h-[70vh] bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-pulse" />
          <div className="container max-w-7xl mx-auto px-4 -mt-32 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !angles || angles.length === 0) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header user={user} />
        <main className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">لا توجد زوايا متاحة</h2>
            <p className="text-muted-foreground">سيتم إضافة زوايا جديدة قريباً</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />

      <main className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 h-[80vh]">
          <div 
            className="absolute inset-0 transition-all duration-700"
            style={{
              background: hoveredAngle 
                ? `linear-gradient(135deg, ${angles.find(a => a.id === hoveredAngle)?.colorHex}15 0%, transparent 50%, ${angles.find(a => a.id === hoveredAngle)?.colorHex}08 100%)`
                : 'linear-gradient(135deg, hsl(var(--primary)/0.03) 0%, transparent 50%, hsl(var(--accent)/0.05) 100%)'
            }}
          />
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-16 pb-8 px-4" data-testid="section-hero">
          <div className="container max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>محتوى حصري ومتعمق</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-l from-foreground via-foreground to-muted-foreground bg-clip-text" data-testid="heading-title">
                مُقترب
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" data-testid="text-tagline">
                زوايا فريدة تأخذك إلى أعماق القصص والأحداث
              </p>
            </motion.div>
          </div>
        </section>

        {/* Featured Section - Bento Grid Style */}
        <section className="relative container max-w-7xl mx-auto px-4 py-12" data-testid="section-featured">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Featured Angle */}
            {featuredAngle && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="lg:row-span-2"
              >
                <Link href={`/muqtarab/${featuredAngle.slug}`}>
                  <div 
                    className="group relative h-full min-h-[400px] lg:min-h-[500px] rounded-3xl overflow-hidden cursor-pointer"
                    onMouseEnter={() => setHoveredAngle(featuredAngle.id)}
                    onMouseLeave={() => setHoveredAngle(null)}
                    data-testid={`card-featured-${featuredAngle.id}`}
                  >
                    {/* Background with cover image or gradient */}
                    {featuredAngle.coverImageUrl ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${featuredAngle.coverImageUrl})` }}
                      />
                    ) : (
                      <div 
                        className="absolute inset-0 transition-all duration-500"
                        style={{ 
                          background: `linear-gradient(135deg, ${featuredAngle.colorHex}30 0%, ${featuredAngle.colorHex}10 100%)` 
                        }}
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${featuredAngle.colorHex}40` }}
                      >
                        {(() => {
                          const Icon = getIconComponent(featuredAngle.iconKey || 'Circle');
                          return <Icon className="w-8 h-8" />;
                        })()}
                      </div>
                      
                      <Badge 
                        className="w-fit mb-3 text-xs"
                        style={{ backgroundColor: featuredAngle.colorHex }}
                      >
                        زاوية مميزة
                      </Badge>
                      
                      <h2 className="text-3xl md:text-4xl font-bold mb-3 group-hover:text-primary-foreground transition-colors">
                        {featuredAngle.nameAr}
                      </h2>
                      
                      {featuredAngle.shortDesc && (
                        <p className="text-lg text-white/80 line-clamp-2 mb-4 max-w-lg">
                          {featuredAngle.shortDesc}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-white/70">
                        {(featuredAngle as any).articleCount > 0 && (
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            {(featuredAngle as any).articleCount} مقال
                          </span>
                        )}
                        {(featuredAngle as any).topicCount > 0 && (
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            {(featuredAngle as any).topicCount} موضوع
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-6 flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>استكشف الزاوية</span>
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Secondary Angles */}
            {secondaryAngles.map((angle, index) => {
              const Icon = getIconComponent(angle.iconKey || 'Circle');
              return (
                <motion.div
                  key={angle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                >
                  <Link href={`/muqtarab/${angle.slug}`}>
                    <div 
                      className="group relative h-full min-h-[240px] rounded-3xl overflow-hidden cursor-pointer border border-border/50 bg-card"
                      onMouseEnter={() => setHoveredAngle(angle.id)}
                      onMouseLeave={() => setHoveredAngle(null)}
                      data-testid={`card-secondary-${angle.id}`}
                    >
                      {/* Accent gradient */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ 
                          background: `linear-gradient(135deg, ${angle.colorHex}15 0%, transparent 60%)` 
                        }}
                      />
                      
                      {/* Cover image if available */}
                      {angle.coverImageUrl && (
                        <div 
                          className="absolute top-0 left-0 w-1/3 h-full bg-cover bg-center opacity-30"
                          style={{ backgroundImage: `url(${angle.coverImageUrl})` }}
                        />
                      )}
                      
                      {/* Content */}
                      <div className="relative h-full p-6 flex flex-col justify-between">
                        <div>
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                            style={{ 
                              backgroundColor: `${angle.colorHex}15`,
                              color: angle.colorHex 
                            }}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                            {angle.nameAr}
                          </h3>
                          
                          {angle.shortDesc && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {angle.shortDesc}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {(angle as any).articleCount > 0 && (
                              <span>{(angle as any).articleCount} مقال</span>
                            )}
                            {(angle as any).topicCount > 0 && (
                              <span>{(angle as any).topicCount} موضوع</span>
                            )}
                          </div>
                          
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                            style={{ backgroundColor: angle.colorHex }}
                          >
                            <ArrowLeft className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom accent line */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right"
                        style={{ backgroundColor: angle.colorHex }}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Remaining Angles - Horizontal Scrolling Cards */}
        {remainingAngles.length > 0 && (
          <section className="relative py-12" data-testid="section-explore">
            <div className="container max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">المزيد من الزوايا</h2>
                <div className="h-px flex-1 mx-6 bg-gradient-to-l from-border to-transparent" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {remainingAngles.map((angle, index) => {
                  const Icon = getIconComponent(angle.iconKey || 'Circle');
                  return (
                    <motion.div
                      key={angle.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 * index }}
                    >
                      <Link href={`/muqtarab/${angle.slug}`}>
                        <div 
                          className="group relative rounded-2xl overflow-hidden border border-border/50 bg-card p-5 h-full hover-elevate transition-all duration-300"
                          onMouseEnter={() => setHoveredAngle(angle.id)}
                          onMouseLeave={() => setHoveredAngle(null)}
                          data-testid={`card-angle-${angle.id}`}
                        >
                          {/* Hover gradient */}
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ 
                              background: `radial-gradient(circle at top right, ${angle.colorHex}10 0%, transparent 70%)` 
                            }}
                          />
                          
                          <div className="relative">
                            <div className="flex items-start gap-4 mb-4">
                              <div 
                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                                style={{ 
                                  backgroundColor: `${angle.colorHex}15`,
                                  color: angle.colorHex 
                                }}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                  {angle.nameAr}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {(angle as any).articleCount > 0 && (
                                    <span>{(angle as any).articleCount} مقال</span>
                                  )}
                                  {(angle as any).topicCount > 0 && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                      <span>{(angle as any).topicCount} موضوع</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {angle.shortDesc && (
                              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {angle.shortDesc}
                              </p>
                            )}
                          </div>
                          
                          {/* Corner accent */}
                          <div 
                            className="absolute top-0 left-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `radial-gradient(circle at top left, ${angle.colorHex}20 0%, transparent 70%)`
                            }}
                          />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="relative py-16 px-4">
          <div className="container max-w-3xl mx-auto text-center">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 p-12 border border-border/50">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <h3 className="text-2xl font-bold mb-3">اكتشف المزيد من المحتوى</h3>
                <p className="text-muted-foreground mb-6">
                  تابعنا للحصول على أحدث الزوايا والتحليلات المتعمقة
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>محتوى جديد كل أسبوع</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
