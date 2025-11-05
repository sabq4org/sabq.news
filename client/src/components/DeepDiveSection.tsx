import { BarChart3 } from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleWithDetails } from "@shared/schema";

interface DeepDiveSectionProps {
  articles: ArticleWithDetails[];
}

export function DeepDiveSection({ articles }: DeepDiveSectionProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold" data-testid="heading-deep-dive">
          تحليلات وآراء
        </h2>
      </div>
      
      <p className="text-muted-foreground">
        مقالات تحليلية معمقة مدعومة بالذكاء الاصطناعي
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {articles.map((article) => (
          <ArticleCard 
            key={article.id}
            article={article}
            variant="grid"
          />
        ))}
      </div>
    </section>
  );
}
