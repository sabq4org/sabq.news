import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrendingTopicsProps {
  topics: Array<{ topic: string; count: number }>;
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  if (!topics || topics.length === 0) return null;

  const maxCount = Math.max(...topics.map(t => t.count));

  const getSizeClass = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-xl font-bold";
    if (ratio > 0.4) return "text-lg font-semibold";
    return "text-base font-medium";
  };

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold" data-testid="heading-trending-topics">
          موضوعات صاعدة
        </h2>
      </div>
      
      <p className="text-muted-foreground">
        أكثر المواضيع تداولاً خلال الـ 24 ساعة الماضية
      </p>

      <div className="flex flex-wrap gap-3 p-6 bg-card rounded-lg border">
        {topics.map((topic, index) => (
          <Badge
            key={index}
            variant="secondary"
            className={`cursor-pointer ${getSizeClass(topic.count)}`}
            data-testid={`badge-topic-${index}`}
          >
            {topic.topic}
            <span className="mr-2 text-xs opacity-70">({topic.count})</span>
          </Badge>
        ))}
      </div>
    </section>
  );
}
