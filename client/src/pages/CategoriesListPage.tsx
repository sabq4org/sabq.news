import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Newspaper,
  Eye,
  Heart,
  Bookmark,
  FileText,
  FolderOpen,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
} from "lucide-react";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

interface CategoryWithStats extends Category {
  articleCount: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
}

type ViewMode = "grid" | "list";
type SortMode = "newest" | "articles" | "views";

export default function CategoriesListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const { data: user } = useQuery<{ id: string; name?: string; email?: string; role?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: categories = [], isLoading } = useQuery<CategoryWithStats[]>({
    queryKey: ["/api/categories", "withStats"],
    queryFn: async () => {
      const res = await fetch("/api/categories?withStats=true", { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Filter and sort categories
  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories
      .filter((cat) => cat.status === "active" && cat.type === "core")
      .filter((cat) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          cat.nameAr.toLowerCase().includes(query) ||
          cat.nameEn?.toLowerCase().includes(query) ||
          cat.description?.toLowerCase().includes(query)
        );
      });

    // Sort based on selected mode
    switch (sortMode) {
      case "articles":
        filtered.sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0));
        break;
      case "views":
        filtered.sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        break;
    }

    return filtered;
  }, [categories, searchQuery, sortMode]);

  // Calculate overall statistics
  const statistics = useMemo(() => {
    const activeCategories = categories.filter(
      (cat) => cat.status === "active" && cat.type === "core"
    );

    return {
      totalCategories: activeCategories.length,
      totalArticles: activeCategories.reduce((sum, cat) => sum + (cat.articleCount || 0), 0),
      totalViews: activeCategories.reduce((sum, cat) => sum + (cat.totalViews || 0), 0),
      totalEngagement: activeCategories.reduce(
        (sum, cat) => sum + (cat.totalLikes || 0) + (cat.totalBookmarks || 0),
        0
      ),
    };
  }, [categories]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header user={user} />

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="heading-categories">
            التصنيفات
          </h1>
          <p className="text-muted-foreground">
            استكشف جميع تصنيفات الأخبار
          </p>
        </div>

        {/* Statistics Summary */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Categories */}
            <Card className="hover-elevate" data-testid="stat-total-categories">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي التصنيفات
                </CardTitle>
                <FolderOpen className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalCategories}</div>
                <p className="text-xs text-muted-foreground mt-1">تصنيف نشط</p>
              </CardContent>
            </Card>

            {/* Total Articles */}
            <Card className="hover-elevate" data-testid="stat-total-articles">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي المقالات
                </CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalArticles.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">عبر جميع التصنيفات</p>
              </CardContent>
            </Card>

            {/* Total Views */}
            <Card className="hover-elevate" data-testid="stat-total-views">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي المشاهدات
                </CardTitle>
                <Eye className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">مشاهدة كلية</p>
              </CardContent>
            </Card>

            {/* Total Engagement */}
            <Card className="hover-elevate" data-testid="stat-total-engagement">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي التفاعل
                </CardTitle>
                <Heart className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalEngagement.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">إعجاب وحفظ</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن تصنيف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              data-testid="input-search-categories"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort Dropdown */}
          <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-sort">
              <ArrowUpDown className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" data-testid="option-sort-newest">الأحدث</SelectItem>
              <SelectItem value="articles" data-testid="option-sort-articles">الأكثر مقالات</SelectItem>
              <SelectItem value="views" data-testid="option-sort-views">الأكثر مشاهدة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categories Grid/List */}
        {isLoading ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-10" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedCategories.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              {searchQuery ? "لم يتم العثور على تصنيفات مطابقة" : "لا توجد تصنيفات متاحة حالياً"}
            </p>
          </div>
        ) : (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {filteredAndSortedCategories.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <Card
                  className="hover-elevate active-elevate-2 cursor-pointer h-full group"
                  data-testid={`card-category-${category.id}`}
                >
                  <CardContent className="p-6">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-4">
                      {/* Icon */}
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{
                          background: category.color
                            ? `${category.color}20`
                            : 'hsl(var(--primary) / 0.2)',
                        }}
                      >
                        {category.icon ? (
                          <span style={{ color: category.color || 'hsl(var(--primary))' }}>
                            {category.icon}
                          </span>
                        ) : (
                          <Newspaper
                            className="h-6 w-6"
                            style={{ color: category.color || 'hsl(var(--primary))' }}
                          />
                        )}
                      </div>

                      {/* Category Name */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate"
                          data-testid={`text-category-name-${category.id}`}
                        >
                          {category.nameAr}
                        </h3>
                        {category.nameEn && (
                          <p className="text-xs text-muted-foreground truncate">
                            {category.nameEn}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Compact Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Articles */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" data-testid={`stat-articles-${category.id}`}>
                            {(category.articleCount || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">مقالات</p>
                        </div>
                      </div>

                      {/* Views */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5">
                        <Eye className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" data-testid={`stat-views-${category.id}`}>
                            {(category.totalViews || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">مشاهدات</p>
                        </div>
                      </div>

                      {/* Likes */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5">
                        <Heart className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" data-testid={`stat-likes-${category.id}`}>
                            {(category.totalLikes || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">إعجابات</p>
                        </div>
                      </div>

                      {/* Bookmarks */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5">
                        <Bookmark className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" data-testid={`stat-bookmarks-${category.id}`}>
                            {(category.totalBookmarks || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">حفظ</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
