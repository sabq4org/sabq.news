import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type ActivityLog = {
  id: string;
  actionType: string;
  description: string;
  createdAt: string;
  articleId: string | null;
};

export default function ActivityLogPage() {
  const { user } = useAuth({ redirectToLogin: true });

  const { data: activities = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/publisher/logs"],
    enabled: !!user,
  });

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-activity-log">
          سجل النشاط
        </h1>
        <p className="text-muted-foreground mt-1">
          سجل كامل لنشاطاتك في بوابة الناشر
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div
              className="p-12 text-center text-muted-foreground"
              data-testid="text-no-activities"
            >
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">لا توجد أنشطة مسجلة</p>
              <p className="text-sm mt-2">
                سيتم تسجيل نشاطاتك هنا
              </p>
            </div>
          ) : (
            <Table data-testid="table-activity-log">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ والوقت</TableHead>
                  <TableHead className="text-right">نوع النشاط</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    data-testid={`row-activity-${activity.id}`}
                  >
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span>
                          {new Date(activity.createdAt).toLocaleDateString("ar-SA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-xs">
                          {new Date(activity.createdAt).toLocaleTimeString("ar-SA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-xs opacity-70">
                          (
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                          )
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{activity.actionType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{activity.description}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
