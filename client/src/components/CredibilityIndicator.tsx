import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, ShieldX, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CredibilityFactor {
  name: string;
  score: number;
  note: string;
}

interface CredibilityData {
  score: number;
  factors: CredibilityFactor[];
  summary: string;
}

interface CredibilityIndicatorProps {
  score: number;
  analysis: string;
  lastUpdated: Date;
  compact?: boolean;
}

export function CredibilityIndicator({
  score,
  analysis,
  lastUpdated,
  compact = false,
}: CredibilityIndicatorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  let credibilityData: CredibilityData;
  try {
    credibilityData = JSON.parse(analysis);
  } catch {
    credibilityData = {
      score: score,
      factors: [],
      summary: "لا توجد تفاصيل متاحة",
    };
  }

  const getScoreColor = (score: number) => {
    if (score > 80) return "text-green-600 dark:text-green-500";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-500";
    return "text-red-600 dark:text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score > 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  const getScoreIcon = (score: number) => {
    if (score > 80)
      return <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-500" />;
    if (score >= 60)
      return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />;
    return <ShieldX className="h-5 w-5 text-red-600 dark:text-red-500" />;
  };

  const getScoreLabel = (score: number) => {
    if (score > 80) return "مصداقية عالية";
    if (score >= 60) return "مصداقية متوسطة";
    return "مصداقية منخفضة";
  };

  const getProgressColor = (score: number) => {
    if (score > 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  if (compact) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2", getScoreBgColor(score))}
            data-testid="button-credibility-compact"
          >
            {getScoreIcon(score)}
            <span className={cn("font-medium", getScoreColor(score))}>
              {score}%
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl" data-testid="dialog-credibility-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              {getScoreIcon(score)}
              <span>تحليل مصداقية المقال</span>
            </DialogTitle>
            <DialogDescription className="text-right">
              آخر تحليل:{" "}
              {formatDistanceToNow(new Date(lastUpdated), {
                addSuffix: true,
                locale: arSA,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <div className={cn("text-5xl font-bold mb-2", getScoreColor(score))}>
                {score}%
              </div>
              <Badge variant="outline" className={getScoreBgColor(score)}>
                {getScoreLabel(score)}
              </Badge>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-right">العوامل المؤثرة:</h3>
              {credibilityData.factors.map((factor, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={getScoreColor(factor.score)}>
                      {factor.score}%
                    </span>
                    <span className="font-medium">{factor.name}</span>
                  </div>
                  <Progress
                    value={factor.score}
                    className="h-2"
                    data-testid={`progress-factor-${index}`}
                  />
                  <p className="text-sm text-muted-foreground text-right">
                    {factor.note}
                  </p>
                </div>
              ))}
            </div>

            <div className={cn("p-4 rounded-lg", getScoreBgColor(score))}>
              <h3 className="font-semibold text-right mb-2">الملخص:</h3>
              <p className="text-sm text-right leading-relaxed">
                {credibilityData.summary}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className={cn(getScoreBgColor(score))} data-testid="card-credibility-indicator">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-right text-lg">
          {getScoreIcon(score)}
          <span>مؤشر المصداقية</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                data-testid="button-view-details"
              >
                <Info className="h-4 w-4" />
                <span>عرض التفاصيل</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" data-testid="dialog-credibility-full">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-right">
                  {getScoreIcon(score)}
                  <span>تحليل مصداقية المقال</span>
                </DialogTitle>
                <DialogDescription className="text-right">
                  آخر تحليل:{" "}
                  {formatDistanceToNow(new Date(lastUpdated), {
                    addSuffix: true,
                    locale: arSA,
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="text-center">
                  <div className={cn("text-5xl font-bold mb-2", getScoreColor(score))}>
                    {score}%
                  </div>
                  <Badge variant="outline" className={getScoreBgColor(score)}>
                    {getScoreLabel(score)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-right">العوامل المؤثرة:</h3>
                  {credibilityData.factors.map((factor, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={getScoreColor(factor.score)}>
                          {factor.score}%
                        </span>
                        <span className="font-medium">{factor.name}</span>
                      </div>
                      <Progress
                        value={factor.score}
                        className="h-2"
                        data-testid={`progress-factor-detail-${index}`}
                      />
                      <p className="text-sm text-muted-foreground text-right">
                        {factor.note}
                      </p>
                    </div>
                  ))}
                </div>

                <div className={cn("p-4 rounded-lg", getScoreBgColor(score))}>
                  <h3 className="font-semibold text-right mb-2">الملخص:</h3>
                  <p className="text-sm text-right leading-relaxed">
                    {credibilityData.summary}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-center">
            <div className={cn("text-3xl font-bold", getScoreColor(score))}>
              {score}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              آخر تحليل:{" "}
              {formatDistanceToNow(new Date(lastUpdated), {
                addSuffix: true,
                locale: arSA,
              })}
            </p>
          </div>
        </div>

        <div>
          <Progress
            value={score}
            className="h-3"
            data-testid="progress-credibility-score"
          />
        </div>

        <Badge variant="outline" className={cn("w-full justify-center", getScoreBgColor(score))}>
          {getScoreLabel(score)}
        </Badge>
      </CardContent>
    </Card>
  );
}
