import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Search,
  Filter,
  CalendarIcon,
  X,
  Laptop,
  Brain,
  Globe,
  BookOpen,
  Gamepad2,
  Heart,
  DollarSign,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface Category {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
}

const categories: Category[] = [
  {
    id: "technology",
    label: "التقنية",
    icon: Laptop,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950"
  },
  {
    id: "ai",
    label: "الذكاء الاصطناعي",
    icon: Brain,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950"
  },
  {
    id: "web",
    label: "الويب",
    icon: Globe,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950"
  },
  {
    id: "education",
    label: "التعليم",
    icon: BookOpen,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950"
  },
  {
    id: "gaming",
    label: "الألعاب",
    icon: Gamepad2,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950"
  },
  {
    id: "health",
    label: "الصحة",
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950"
  },
  {
    id: "business",
    label: "الأعمال",
    icon: DollarSign,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950"
  }
];

export interface FilterValues {
  search: string;
  categories: string[];
  status: "all" | "published" | "draft" | "scheduled" | "archived";
  dateFrom?: Date;
  dateTo?: Date;
  aiScoreMin?: number;
  aiScoreMax?: number;
}

interface IFoxArticlesFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onReset: () => void;
  articleCount?: number;
}

export function IFoxArticlesFilters({
  filters,
  onChange,
  onReset,
  articleCount = 0
}: IFoxArticlesFiltersProps) {
  const [expandedFilters, setExpandedFilters] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId];
    onChange({ ...filters, categories: newCategories });
  };

  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value });
  };

  const handleStatusChange = (status: FilterValues["status"]) => {
    onChange({ ...filters, status });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    onChange({ ...filters, dateFrom: date });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onChange({ ...filters, dateTo: date });
  };

  const handleAIScoreChange = (min: number | undefined, max: number | undefined) => {
    onChange({ ...filters, aiScoreMin: min, aiScoreMax: max });
  };

  const activeFiltersCount = 
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.aiScoreMin || filters.aiScoreMax ? 1 : 0);

  return (
    <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-primary/10">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with Search */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">فلاتر البحث</h3>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} فلاتر نشطة
                </Badge>
              )}
              {articleCount > 0 && (
                <Badge variant="outline" className="ml-2">
                  {articleCount} مقال
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-initial">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في المقالات..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pr-10 w-full lg:w-64"
                  dir="rtl"
                  data-testid="input-search-filter"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setExpandedFilters(!expandedFilters)}
                data-testid="button-toggle-filters"
              >
                {expandedFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              </Button>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onReset}
                  data-testid="button-reset-filters"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Categories Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">التصنيفات</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = filters.categories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                      isSelected
                        ? `${category.bgColor} ${category.color} ring-2 ring-primary`
                        : "bg-muted hover:bg-muted/80"
                    )}
                    data-testid={`button-category-${category.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{category.label}</span>
                    {isSelected && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expanded Filters */}
          {expandedFilters && (
            <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">حالة المقال</Label>
                  <RadioGroup 
                    value={filters.status} 
                    onValueChange={(value) => handleStatusChange(value as FilterValues["status"])}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="all" id="status-all" />
                      <Label htmlFor="status-all" className="text-sm cursor-pointer">
                        جميع الحالات
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="published" id="status-published" />
                      <Label htmlFor="status-published" className="text-sm cursor-pointer">
                        منشور
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="draft" id="status-draft" />
                      <Label htmlFor="status-draft" className="text-sm cursor-pointer">
                        مسودة
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="scheduled" id="status-scheduled" />
                      <Label htmlFor="status-scheduled" className="text-sm cursor-pointer">
                        مجدول
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="archived" id="status-archived" />
                      <Label htmlFor="status-archived" className="text-sm cursor-pointer">
                        مؤرشف
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">من تاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right",
                          !filters.dateFrom && "text-muted-foreground"
                        )}
                        data-testid="button-date-from"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {filters.dateFrom ? (
                          format(filters.dateFrom, "PPP", { locale: ar })
                        ) : (
                          <span>اختر التاريخ</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={handleDateFromChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">إلى تاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right",
                          !filters.dateTo && "text-muted-foreground"
                        )}
                        data-testid="button-date-to"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {filters.dateTo ? (
                          format(filters.dateTo, "PPP", { locale: ar })
                        ) : (
                          <span>اختر التاريخ</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={handleDateToChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* AI Score Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    تقييم AI
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="من"
                      value={filters.aiScoreMin || ""}
                      onChange={(e) => handleAIScoreChange(
                        e.target.value ? parseInt(e.target.value) : undefined,
                        filters.aiScoreMax
                      )}
                      min={0}
                      max={100}
                      className="w-20"
                      data-testid="input-ai-score-min"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="إلى"
                      value={filters.aiScoreMax || ""}
                      onChange={(e) => handleAIScoreChange(
                        filters.aiScoreMin,
                        e.target.value ? parseInt(e.target.value) : undefined
                      )}
                      min={0}
                      max={100}
                      className="w-20"
                      data-testid="input-ai-score-max"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onReset}
                  className="gap-2"
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4" />
                  مسح الفلاتر
                </Button>
                <Button
                  onClick={() => setExpandedFilters(false)}
                  className="gap-2"
                  data-testid="button-apply-filters"
                >
                  <Filter className="h-4 w-4" />
                  تطبيق الفلاتر
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}