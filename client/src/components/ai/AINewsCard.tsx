import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Clock, 
  Eye, 
  MessageSquare,
  Sparkles,
  TrendingUp,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface AINewsCardProps {
  article: {
    id: string;
    title: string;
    summary?: string | null;
    slug: string;
    imageUrl?: string | null;
    viewCount?: number | null;
    commentCount?: number | null;
    createdAt: string;
    categoryId?: string | null;
    aiClassification?: string | null;
    featured?: boolean;
    trending?: boolean;
  };
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  "ai-news": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
  "ai-insights": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  "ai-opinions": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  "ai-tools": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  "ai-voice": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30" },
  "ai-academy": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "ai-community": { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30" },
};

export default function AINewsCard({ article }: AINewsCardProps) {
  const { language } = useLanguage();
  const locale = language === "ar" ? ar : enUS;
  
  const categoryStyle = article.categoryId 
    ? categoryColors[article.categoryId] || categoryColors["ai-news"]
    : categoryColors["ai-news"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/article/${article.slug}`}>
        <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70 transition-all cursor-pointer group overflow-hidden">
          <CardContent className="p-0">
            <div className="flex gap-4">
              {/* Image Section */}
              {article.imageUrl && (
                <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/50" />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {article.featured && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {language === "ar" ? "مميز" : "Featured"}
                      </Badge>
                    )}
                    {article.trending && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {language === "ar" ? "رائج" : "Trending"}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div className="flex-1 p-4">
                {/* Category Badge */}
                {article.categoryId && (
                  <div className="mb-2">
                    <Badge className={`${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} text-xs`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      {article.categoryId.replace("ai-", "").replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {article.title}
                </h3>

                {/* Summary */}
                {article.summary && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {article.summary}
                  </p>
                )}

                {/* AI Classification */}
                {article.aiClassification && (
                  <div className="mb-3">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                      AI: {article.aiClassification}
                    </Badge>
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(article.createdAt), {
                        addSuffix: true,
                        locale: locale,
                      })}
                    </span>
                  </div>
                  
                  {article.viewCount !== null && article.viewCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{article.viewCount}</span>
                    </div>
                  )}
                  
                  {article.commentCount !== null && article.commentCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{article.commentCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Border Animation */}
            <div className="h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}