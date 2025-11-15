import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Eye, Share2, Download, Calendar, Clock, Search, Filter, TrendingUp, FileText, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DeepAnalysis {
  id: string;
  title: string;
  topic: string;
  keywords: string[];
  status: string;
  createdAt: string;
  category?: string;
  viewsCount?: number;
  sharesCount?: number;
  downloadsCount?: number;
  generationTime?: number;
}

interface AnalysesResponse {
  analyses: DeepAnalysis[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StatsResponse {
  totalAnalyses: number;
  totalViews: number;
  totalShares: number;
  totalDownloads: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Omq() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
    limit: 9
  });

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<StatsResponse>({
    queryKey: ['/api/omq/stats/summary'],
  });

  // Fetch categories
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ['/api/categories'],
  });

  // Fetch analyses
  const { data: analysesData, isLoading: isLoadingAnalyses, error } = useQuery<AnalysesResponse>({
    queryKey: ['/api/omq', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      const response = await fetch(`/api/omq?${params}`);
      if (!response.ok) {
        throw new Error('فشل في تحميل التحليلات');
      }
      return response.json();
    }
  });

  // Helper functions
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'published':
        return 'منشور';
      case 'draft':
        return 'مسودة';
      case 'archived':
        return 'مؤرشف';
      default:
        return status;
    }
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-US');
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      keyword: "",
      status: "",
      category: "",
      dateFrom: "",
      dateTo: "",
      page: 1,
      limit: 9
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل التحليلات",
      });
    }
  }, [error, toast]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-10 h-10 text-primary" data-testid="icon-brain-header" />
            <h1 className="text-4xl font-bold" data-testid="text-page-title">قسم العُمق</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-6" data-testid="text-page-description">
            تحليلات استراتيجية عميقة مدعومة بـ 3 نماذج AI (GPT-5 + Gemini + Claude)
          </p>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoadingStats ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <Card data-testid="card-kpi-analyses">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">إجمالي التحليلات</p>
                        <p className="text-3xl font-bold" data-testid="text-total-analyses">
                          {formatNumber(stats?.totalAnalyses || 0)}
                        </p>
                      </div>
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-kpi-views">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">المشاهدات</p>
                        <p className="text-3xl font-bold" data-testid="text-total-views">
                          {formatNumber(stats?.totalViews || 0)}
                        </p>
                      </div>
                      <Eye className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-kpi-shares">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">المشاركات</p>
                        <p className="text-3xl font-bold" data-testid="text-total-shares">
                          {formatNumber(stats?.totalShares || 0)}
                        </p>
                      </div>
                      <Share2 className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-kpi-downloads">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">التنزيلات</p>
                        <p className="text-3xl font-bold" data-testid="text-total-downloads">
                          {formatNumber(stats?.totalDownloads || 0)}
                        </p>
                      </div>
                      <Download className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Filters & Search Bar */}
        <Card className="mb-8" data-testid="card-filters">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              الفلاتر والبحث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="lg:col-span-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="input-search"
                    placeholder="بحث في العنوان والموضوع..."
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="published">منشور</SelectItem>
                    <SelectItem value="archived">مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التصنيفات</SelectItem>
                    {categoriesData?.categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <Input
                  data-testid="input-date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  placeholder="من تاريخ"
                />
              </div>

              {/* Date To */}
              <div>
                <Input
                  data-testid="input-date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  placeholder="إلى تاريخ"
                />
              </div>

              {/* Reset Button */}
              <div>
                <Button
                  data-testid="button-reset-filters"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 ml-2" />
                  إعادة تعيين
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Grid */}
        {isLoadingAnalyses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : analysesData && analysesData.analyses && analysesData.analyses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {analysesData.analyses.map((analysis) => (
                <Card key={analysis.id} data-testid={`card-analysis-${analysis.id}`} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant={getStatusVariant(analysis.status)} data-testid={`badge-status-${analysis.id}`}>
                        {getStatusLabel(analysis.status)}
                      </Badge>
                      {analysis.category && (
                        <Badge variant="outline" data-testid={`badge-category-${analysis.id}`}>
                          {analysis.category}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg" data-testid={`text-title-${analysis.id}`}>
                      {analysis.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2" data-testid={`text-topic-${analysis.id}`}>
                      {analysis.topic}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Keywords */}
                    {analysis.keywords && analysis.keywords.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-4">
                        {analysis.keywords.slice(0, 3).map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-keyword-${analysis.id}-${idx}`}>
                            {keyword}
                          </Badge>
                        ))}
                        {analysis.keywords.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{analysis.keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1" data-testid={`metric-views-${analysis.id}`}>
                        <Eye className="w-4 h-4" />
                        <span>{formatNumber(analysis.viewsCount)}</span>
                      </div>
                      <div className="flex items-center gap-1" data-testid={`metric-shares-${analysis.id}`}>
                        <Share2 className="w-4 h-4" />
                        <span>{formatNumber(analysis.sharesCount)}</span>
                      </div>
                      <div className="flex items-center gap-1" data-testid={`metric-downloads-${analysis.id}`}>
                        <Download className="w-4 h-4" />
                        <span>{formatNumber(analysis.downloadsCount)}</span>
                      </div>
                    </div>

                    {/* Generation Time & Date */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {analysis.generationTime && (
                        <div className="flex items-center gap-1" data-testid={`metric-generation-time-${analysis.id}`}>
                          <Clock className="w-3 h-3" />
                          <span>{analysis.generationTime} ث</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1" data-testid={`text-date-${analysis.id}`}>
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(analysis.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      data-testid={`button-view-${analysis.id}`}
                      onClick={() => navigate(`/omq/${analysis.id}`)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      عرض التحليل
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {analysesData.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                  عرض {((filters.page - 1) * filters.limit) + 1} إلى {Math.min(filters.page * filters.limit, analysesData.total)} من {formatNumber(analysesData.total)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    data-testid="button-previous-page"
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, analysesData.totalPages) }, (_, i) => {
                      let pageNum;
                      if (analysesData.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (filters.page <= 3) {
                        pageNum = i + 1;
                      } else if (filters.page >= analysesData.totalPages - 2) {
                        pageNum = analysesData.totalPages - 4 + i;
                      } else {
                        pageNum = filters.page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          data-testid={`button-page-${pageNum}`}
                          variant={filters.page === pageNum ? "default" : "outline"}
                          size="icon"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    data-testid="button-next-page"
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === analysesData.totalPages}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <Card data-testid="card-empty-state">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <Brain className="w-20 h-20 text-muted-foreground mb-4" data-testid="icon-empty-state" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
                  لا توجد تحليلات متاحة حالياً
                </h3>
                <p className="text-muted-foreground mb-6" data-testid="text-empty-description">
                  ابدأ بإنشاء تحليل عميق جديد لرؤية النتائج هنا
                </p>
                <Button
                  data-testid="button-create-analysis"
                  onClick={() => navigate('/dashboard/deep-analysis')}
                  size="lg"
                >
                  <TrendingUp className="w-5 h-5 ml-2" />
                  ابدأ تحليل جديد
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
