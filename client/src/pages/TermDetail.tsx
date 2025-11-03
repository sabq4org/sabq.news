import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface SmartTerm {
  id: string;
  term: string;
  aliases: string[];
  description: string | null;
  category: string | null;
  usageCount: number;
  status: string;
  createdAt: string;
}

export default function TermDetail() {
  const params = useParams();
  const termIdentifier = params.identifier || "";

  const { data: term, isLoading, error } = useQuery<SmartTerm>({
    queryKey: ["/api/smart-terms", termIdentifier],
    enabled: !!termIdentifier,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !term) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive">المصطلح غير موجود</CardTitle>
            <CardDescription className="text-center">
              عذراً، لم نتمكن من العثور على المصطلح المطلوب
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline">
              <Link href="/">
                <a className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  العودة للرئيسية
                </a>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/">
            <a className="hover:text-foreground transition-colors">الرئيسية</a>
          </Link>
          <span>/</span>
          <span>مصطلح</span>
          <span>/</span>
          <span className="text-foreground font-medium">{term.term}</span>
        </div>

        {/* Term Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{term.term}</h1>
              {term.category && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{term.category}</Badge>
                </div>
              )}
            </div>
          </div>

          {term.aliases && term.aliases.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-muted-foreground">الأسماء المستعارة:</span>
              {term.aliases.map((alias, index) => (
                <Badge key={index} variant="outline">
                  {alias}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Term Description */}
        <Card>
          <CardHeader>
            <CardTitle>التعريف</CardTitle>
          </CardHeader>
          <CardContent>
            {term.description ? (
              <p className="text-lg leading-relaxed">{term.description}</p>
            ) : (
              <p className="text-muted-foreground italic">لا يوجد تعريف متاح لهذا المصطلح حالياً</p>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>إحصائيات الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">
                  {term.usageCount.toLocaleString('ar-SA')}
                </div>
                <div className="text-sm text-muted-foreground">مرة استخدام</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">
                  {term.aliases?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">اسم مستعار</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <a className="gap-2">
                <ArrowRight className="h-4 w-4" />
                العودة للرئيسية
              </a>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
