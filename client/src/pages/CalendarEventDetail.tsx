import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Calendar,
  Globe,
  MapPin,
  Building2,
  Star,
  ArrowLeft,
  Sparkles,
  FileText,
  Heading,
  BarChart,
  MessageSquare,
  Search,
  PenTool,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { CalendarEvent as BaseCalendarEvent, CalendarAiDraft as BaseCalendarAiDraft } from "@shared/schema";

interface CalendarEvent extends BaseCalendarEvent {
  category?: {
    id: string;
    nameAr: string;
  };
}

interface AiDraft extends BaseCalendarAiDraft {}

export default function CalendarEventDetail() {
  const [, params] = useRoute("/dashboard/calendar/events/:id");
  const eventId = params?.id;
  const { toast } = useToast();

  const { data: event, isLoading: eventLoading } = useQuery<CalendarEvent>({
    queryKey: [`/api/calendar/events/${eventId}`],
    enabled: !!eventId,
  });

  const { data: aiDraft, isLoading: draftLoading } = useQuery<AiDraft>({
    queryKey: [`/api/calendar/events/${eventId}/ai-drafts`],
    enabled: !!eventId,
  });

  const generateAiDraft = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/calendar/events/${eventId}/ai-drafts/generate`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calendar/events/${eventId}/ai-drafts`] });
      toast({
        title: "تم التوليد بنجاح",
        description: "تم توليد مسودات الذكاء الاصطناعي للمناسبة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء توليد المسودات",
        variant: "destructive",
      });
    },
  });

  const createArticleFromIdea = useMutation({
    mutationFn: async (ideaIndex: number) => {
      return await apiRequest(`/api/calendar/events/${eventId}/create-article`, {
        method: "POST",
        body: JSON.stringify({ ideaIndex }),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "تم إنشاء المقال",
        description: "تم إنشاء مقال جديد من الفكرة",
      });
      window.location.href = `/dashboard/articles/${data.articleId}`;
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء المقال",
        variant: "destructive",
      });
    },
  });

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>مناسبة غير موجودة</CardTitle>
            <CardDescription>لم يتم العثور على المناسبة المطلوبة</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/calendar">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة إلى التقويم
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "GLOBAL":
        return <Globe className="h-5 w-5" />;
      case "NATIONAL":
        return <MapPin className="h-5 w-5" />;
      case "INTERNAL":
        return <Building2 className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "GLOBAL":
        return "عالمي";
      case "NATIONAL":
        return "وطني";
      case "INTERNAL":
        return "داخلي";
      default:
        return type;
    }
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 5) return "bg-red-500";
    if (importance >= 4) return "bg-orange-500";
    if (importance >= 3) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard/calendar">
            <Button variant="outline" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة إلى التقويم
            </Button>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" data-testid="button-edit">
              <Edit className="h-4 w-4 ml-2" />
              تعديل
            </Button>
            <Button variant="outline" data-testid="button-delete">
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${getImportanceColor(event.importance)}/10`}>
                {getEventIcon(event.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <Badge variant="outline">{getEventTypeLabel(event.type)}</Badge>
                  {event.importance >= 4 && (
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 ml-1" />
                      مهم
                    </Badge>
                  )}
                </div>
                
                <CardDescription>{event.description}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">تاريخ البدء</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(event.dateStart).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {event.dateEnd && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">تاريخ الانتهاء</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(event.dateEnd).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">الأولوية</h4>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: event.importance }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <span className="text-sm">{event.importance} من 5</span>
                </div>
              </div>

              {event.category && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">التصنيف</h4>
                  <Badge variant="secondary">{event.category.nameAr}</Badge>
                </div>
              )}
            </div>

            {event.tags && event.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">الوسوم</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  مسودات الذكاء الاصطناعي
                </CardTitle>
                <CardDescription>
                  أفكار ومحتوى تحريري مولد بواسطة الذكاء الاصطناعي
                </CardDescription>
              </div>

              <Button
                onClick={() => generateAiDraft.mutate()}
                disabled={generateAiDraft.isPending}
                data-testid="button-generate-ai"
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${generateAiDraft.isPending ? "animate-spin" : ""}`} />
                {aiDraft ? "إعادة التوليد" : "توليد المسودات"}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {draftLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
              </div>
            ) : aiDraft ? (
              <Tabs defaultValue="ideas" className="w-full">
                <TabsList className="w-full grid grid-cols-3 lg:grid-cols-6">
                  <TabsTrigger value="ideas" data-testid="tab-ideas">
                    <FileText className="h-4 w-4 ml-1" />
                    الأفكار
                  </TabsTrigger>
                  <TabsTrigger value="headlines" data-testid="tab-headlines">
                    <Heading className="h-4 w-4 ml-1" />
                    العناوين
                  </TabsTrigger>
                  <TabsTrigger value="infographic" data-testid="tab-infographic">
                    <BarChart className="h-4 w-4 ml-1" />
                    الإنفوجرافيك
                  </TabsTrigger>
                  <TabsTrigger value="social" data-testid="tab-social">
                    <MessageSquare className="h-4 w-4 ml-1" />
                    السوشال
                  </TabsTrigger>
                  <TabsTrigger value="seo" data-testid="tab-seo">
                    <Search className="h-4 w-4 ml-1" />
                    SEO
                  </TabsTrigger>
                  <TabsTrigger value="article" data-testid="tab-article">
                    <PenTool className="h-4 w-4 ml-1" />
                    المقال
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ideas" className="space-y-4 mt-6">
                  {aiDraft.ideas && Array.isArray(aiDraft.ideas) && aiDraft.ideas.length > 0 ? (
                    aiDraft.ideas.map((idea: any, idx: number) => (
                      <Card key={idx}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <CardTitle className="text-lg">{idea.title || `فكرة ${idx + 1}`}</CardTitle>
                              {idea.type && (
                                <CardDescription>النوع: {idea.type}</CardDescription>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => createArticleFromIdea.mutate(idx)}
                              disabled={createArticleFromIdea.isPending}
                              data-testid={`button-create-article-${idx}`}
                            >
                              إنشاء مقال
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {idea.alternateTitle && (
                            <div>
                              <h5 className="font-semibold text-sm mb-1">عنوان بديل:</h5>
                              <p className="text-sm">{idea.alternateTitle}</p>
                            </div>
                          )}
                          
                          {idea.angle && (
                            <div>
                              <h5 className="font-semibold text-sm mb-1">الزاوية:</h5>
                              <p className="text-sm">{idea.angle}</p>
                            </div>
                          )}
                          
                          {idea.openingParagraph && (
                            <div>
                              <h5 className="font-semibold text-sm mb-1">الفقرة الافتتاحية:</h5>
                              <p className="text-sm leading-relaxed">{idea.openingParagraph}</p>
                            </div>
                          )}
                          
                          {idea.keyPoints && idea.keyPoints.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-sm mb-2">النقاط الرئيسية:</h5>
                              <ul className="list-disc list-inside space-y-1">
                                {idea.keyPoints.map((point: string, i: number) => (
                                  <li key={i} className="text-sm">{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد أفكار متاحة
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="headlines" className="mt-6">
                  {aiDraft.headlines && typeof aiDraft.headlines === "object" ? (
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        {(aiDraft.headlines as any).primary && (
                          <div>
                            <h5 className="font-semibold mb-2">العنوان الرئيسي:</h5>
                            <p className="text-lg font-bold">{(aiDraft.headlines as any).primary}</p>
                          </div>
                        )}
                        
                        {(aiDraft.headlines as any).secondary && (
                          <div>
                            <h5 className="font-semibold mb-2">العنوان الثانوي:</h5>
                            <p className="text-md">{(aiDraft.headlines as any).secondary}</p>
                          </div>
                        )}
                        
                        {(aiDraft.headlines as any).alternates && Array.isArray((aiDraft.headlines as any).alternates) && (
                          <div>
                            <h5 className="font-semibold mb-2">عناوين بديلة:</h5>
                            <ul className="space-y-2">
                              {(aiDraft.headlines as any).alternates.map((alt: string, i: number) => (
                                <li key={i} className="p-3 bg-muted rounded-md">{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد عناوين متاحة
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="infographic" className="mt-6">
                  {aiDraft.infographic && typeof aiDraft.infographic === "object" ? (
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        {(aiDraft.infographic as any).title && (
                          <h3 className="text-xl font-bold text-center">{(aiDraft.infographic as any).title}</h3>
                        )}
                        
                        {(aiDraft.infographic as any).subtitle && (
                          <p className="text-center text-muted-foreground">{(aiDraft.infographic as any).subtitle}</p>
                        )}
                        
                        {(aiDraft.infographic as any).dataPoints && Array.isArray((aiDraft.infographic as any).dataPoints) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {(aiDraft.infographic as any).dataPoints.map((point: any, i: number) => (
                              <Card key={i}>
                                <CardContent className="p-4 text-center">
                                  <div className="text-3xl font-bold text-primary mb-2">
                                    {point.value}
                                  </div>
                                  <p className="text-sm font-semibold">{point.label}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد بيانات إنفوجرافيك متاحة
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="social" className="mt-6">
                  {(aiDraft as any).social && typeof (aiDraft as any).social === "object" ? (
                    <div className="space-y-4">
                      {Object.entries((aiDraft as any).social as object).map(([platform, content]) => (
                        <Card key={platform}>
                          <CardHeader>
                            <CardTitle className="text-lg capitalize">{platform}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="whitespace-pre-wrap">{content as string}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا يوجد محتوى سوشال ميديا متاح
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="seo" className="mt-6">
                  {aiDraft.seo && typeof aiDraft.seo === "object" ? (
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        {(aiDraft.seo as any).keywords && Array.isArray((aiDraft.seo as any).keywords) && (
                          <div>
                            <h5 className="font-semibold mb-2">الكلمات المفتاحية:</h5>
                            <div className="flex flex-wrap gap-2">
                              {(aiDraft.seo as any).keywords.map((keyword: string, i: number) => (
                                <Badge key={i} variant="secondary">{keyword}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(aiDraft.seo as any).metaDescription && (
                          <div>
                            <h5 className="font-semibold mb-2">وصف الميتا:</h5>
                            <p className="text-sm">{(aiDraft.seo as any).metaDescription}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد بيانات SEO متاحة
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="article" className="mt-6">
                  {(aiDraft as any).articleDraft ? (
                    <Card>
                      <CardContent className="p-6">
                        <div className="prose prose-lg max-w-none" dir="rtl">
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {(aiDraft as any).articleDraft as string}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد مسودة مقال متاحة
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لم يتم توليد مسودات بعد</h3>
                <p className="text-muted-foreground mb-4">
                  اضغط على زر "توليد المسودات" لإنشاء محتوى بواسطة الذكاء الاصطناعي
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
