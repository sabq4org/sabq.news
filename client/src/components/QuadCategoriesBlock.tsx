import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import { Eye, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";

// Icon mapper
const getIcon = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Folder;
  return Icon;
};

// Types
interface CategoryColumnData {
  category: {
    slug: string;
    name: string;
    icon: string;
  };
  stats: {
    label: string;
    value: number;
    trend?: string;
  };
  featured: {
    id: string;
    title: string;
    image?: string;
    href: string;
    meta: {
      age: string;
      readMins: number;
      views: number;
      badge?: string | null;
    };
  };
  list: Array<{
    id: string;
    title: string;
    href: string;
    meta: {
      views: number;
      age: string;
    };
  }>;
  teaser?: string;
}

interface QuadCategoriesData {
  items: CategoryColumnData[];
  mobileCarousel: boolean;
  backgroundColor?: string;
}

// Featured Card Component
function FeaturedCard({ data }: { data: CategoryColumnData["featured"] }) {
  return (
    <Link href={data.href}>
      <div 
        className="group relative overflow-hidden rounded-lg mb-3 cursor-pointer"
        data-testid={`featured-card-${data.id}`}
      >
        {/* Image */}
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {data.image ? (
            <img
              src={data.image}
              alt={data.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              style={{
                objectPosition: (data as any).imageFocalPoint
                  ? `${(data as any).imageFocalPoint.x}% ${(data as any).imageFocalPoint.y}%`
                  : 'center'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
          )}
          
          {/* Badge */}
          {data.meta.badge && (
            <div className="absolute top-2 right-2">
              <Badge 
                variant={data.meta.badge === "عاجل" ? "destructive" : "secondary"}
                className="text-xs font-bold"
                data-testid="featured-badge"
              >
                {data.meta.badge}
              </Badge>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 
          className="font-bold text-sm mt-2 line-clamp-2 group-hover:text-primary transition-colors"
          data-testid="featured-title"
        >
          {data.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1" data-testid="featured-time">
            <Clock className="w-3 h-3" />
            <span>{data.meta.age}</span>
          </div>
          <div className="flex items-center gap-1" data-testid="featured-views">
            <Eye className="w-3 h-3" />
            <span>{data.meta.views.toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Title List Component
function TitleList({ items }: { items: CategoryColumnData["list"] }) {
  return (
    <div className="space-y-2" data-testid="title-list">
      {items.map((item, index) => (
        <Link key={item.id} href={item.href}>
          <div
            className="group py-2 border-b border-border last:border-0 cursor-pointer"
            data-testid={`list-item-${index}`}
          >
            <h4 className="text-sm font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-2.5 h-2.5" />
                <span>{item.meta.views.toLocaleString('en-US')}</span>
              </div>
              <span>{item.meta.age}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Column Header Component
function ColumnHeader({ category, stats, teaser }: Pick<CategoryColumnData, 'category' | 'stats' | 'teaser'>) {
  const IconComponent = getIcon(category.icon);

  return (
    <div className="mb-4" data-testid="column-header">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold" data-testid="category-name">
            {category.name}
          </h2>
        </div>
        <Badge variant="secondary" className="text-xs" data-testid="category-stats">
          {stats.value.toLocaleString('en-US')} {stats.label}
        </Badge>
      </div>
      {teaser && (
        <p className="text-xs text-muted-foreground" data-testid="category-teaser">
          {teaser}
        </p>
      )}
    </div>
  );
}

// Category Column Component
function CategoryColumn({ data, index }: { data: CategoryColumnData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-4"
      data-testid={`category-column-${data.category.slug}`}
    >
      <ColumnHeader 
        category={data.category}
        stats={data.stats}
        teaser={data.teaser}
      />
      <FeaturedCard data={data.featured} />
      <TitleList items={data.list} />
    </motion.div>
  );
}

// Horizontal Carousel Component (Mobile)
function HorizontalCarousel({ items }: { items: CategoryColumnData[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const cardWidth = container.scrollWidth / items.length;
    
    if (direction === 'right' && currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      container.scrollTo({ left: (currentIndex + 1) * cardWidth, behavior: 'smooth' });
    } else if (direction === 'left' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      container.scrollTo({ left: (currentIndex - 1) * cardWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative" data-testid="mobile-carousel">
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item, index) => (
          <div 
            key={item.category.slug} 
            className="flex-shrink-0 w-[85vw] max-w-md snap-start"
          >
            <CategoryColumn data={item} index={index} />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => scroll('right')}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-border shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover-elevate active-elevate-2"
            data-testid="carousel-prev"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('left')}
            disabled={currentIndex === items.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-border shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover-elevate active-elevate-2"
            data-testid="carousel-next"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Indicators */}
      <div className="flex justify-center gap-1.5 mt-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              if (scrollRef.current) {
                const cardWidth = scrollRef.current.scrollWidth / items.length;
                scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
              }
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-primary w-6' 
                : 'bg-muted-foreground/30'
            }`}
            data-testid={`carousel-indicator-${index}`}
          />
        ))}
      </div>
    </div>
  );
}

// Loading Skeleton
function QuadCategoriesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="aspect-[16/9] w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-12 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Component
export function QuadCategoriesBlock() {
  const { data, isLoading } = useQuery<QuadCategoriesData>({
    queryKey: ["/api/blocks/quad-categories"],
  });

  if (isLoading) {
    return <QuadCategoriesSkeleton />;
  }

  if (!data || data.items.length === 0) {
    return null;
  }

  return (
    <div 
      data-testid="quad-categories-block"
      className="relative -mx-4 sm:-mx-6 lg:-mx-8"
      style={data.backgroundColor ? { backgroundColor: data.backgroundColor } : undefined}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Mobile View: Carousel */}
          {data.mobileCarousel && (
            <div className="lg:hidden">
              <HorizontalCarousel items={data.items} />
            </div>
          )}

          {/* Mobile View: Grid (if carousel disabled) */}
          {!data.mobileCarousel && (
            <div className="lg:hidden grid grid-cols-1 gap-4">
              {data.items.map((item, index) => (
                <CategoryColumn key={item.category.slug} data={item} index={index} />
              ))}
            </div>
          )}

          {/* Tablet View: 2 columns */}
          <div className="hidden lg:grid xl:hidden grid-cols-2 gap-4">
            {data.items.map((item, index) => (
              <CategoryColumn key={item.category.slug} data={item} index={index} />
            ))}
          </div>

          {/* Desktop View: 4 columns */}
          <div className="hidden xl:grid grid-cols-4 gap-4">
            {data.items.map((item, index) => (
              <CategoryColumn key={item.category.slug} data={item} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
