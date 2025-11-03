import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Link2, ArrowRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface SmartEntity {
  id: string;
  name: string;
  aliases: string[];
  typeId: number;
  description: string | null;
  imageUrl: string | null;
  slug: string;
  importanceScore: number;
  usageCount: number;
  status: string;
  metadata?: {
    birthDate?: string;
    position?: string;
    organization?: string;
    location?: string;
    website?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
  };
  createdAt: string;
}

export default function EntityDetail() {
  const params = useParams();
  const slug = params.slug || "";

  const { data: entity, isLoading, error } = useQuery<SmartEntity>({
    queryKey: ["/api/smart-entities", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-32 w-32 rounded-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive">الكيان غير موجود</CardTitle>
            <CardDescription className="text-center">
              عذراً، لم نتمكن من العثور على الكيان المطلوب
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

  const importancePercentage = Math.round(entity.importanceScore * 100);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/">
            <a className="hover:text-foreground transition-colors">الرئيسية</a>
          </Link>
          <span>/</span>
          <span>كيان</span>
          <span>/</span>
          <span className="text-foreground font-medium">{entity.name}</span>
        </div>

        {/* Entity Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={entity.imageUrl || undefined} alt={entity.name} />
              <AvatarFallback className="text-3xl">
                <User className="h-16 w-16" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{entity.name}</h1>
              {entity.metadata?.position && (
                <p className="text-xl text-muted-foreground mb-3">{entity.metadata.position}</p>
              )}
              {entity.metadata?.organization && (
                <p className="text-lg text-muted-foreground mb-3">{entity.metadata.organization}</p>
              )}
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">أهمية: {importancePercentage}%</span>
              </div>
            </div>
          </div>

          {entity.aliases && entity.aliases.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="text-sm text-muted-foreground">الأسماء المستعارة:</span>
              {entity.aliases.map((alias, index) => (
                <Badge key={index} variant="outline">
                  {alias}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Entity Description */}
        {entity.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>نبذة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{entity.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Entity Metadata */}
        {entity.metadata && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>معلومات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entity.metadata.birthDate && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">تاريخ الميلاد</span>
                  <span className="font-medium">{entity.metadata.birthDate}</span>
                </div>
              )}
              {entity.metadata.location && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">الموقع</span>
                  <span className="font-medium">{entity.metadata.location}</span>
                </div>
              )}
              {entity.metadata.website && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">الموقع الإلكتروني</span>
                  <a 
                    href={entity.metadata.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Link2 className="h-4 w-4" />
                    زيارة الموقع
                  </a>
                </div>
              )}
              {entity.metadata.social && Object.keys(entity.metadata.social).length > 0 && (
                <div className="py-2">
                  <span className="text-muted-foreground block mb-2">وسائل التواصل الاجتماعي</span>
                  <div className="flex gap-2">
                    {entity.metadata.social.twitter && (
                      <a 
                        href={entity.metadata.social.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <Badge variant="secondary">تويتر</Badge>
                      </a>
                    )}
                    {entity.metadata.social.linkedin && (
                      <a 
                        href={entity.metadata.social.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <Badge variant="secondary">لينكد إن</Badge>
                      </a>
                    )}
                    {entity.metadata.social.instagram && (
                      <a 
                        href={entity.metadata.social.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <Badge variant="secondary">انستغرام</Badge>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">
                  {entity.usageCount.toLocaleString('ar-SA')}
                </div>
                <div className="text-sm text-muted-foreground">مرة استخدام</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">
                  {entity.aliases?.length || 0}
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
