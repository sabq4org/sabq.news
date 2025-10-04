import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Edit, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Theme } from "@shared/schema";

export default function ThemeManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: themes, isLoading } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/themes/${id}/publish`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes/active"] });
      toast({
        title: "تم النشر",
        description: "تم تفعيل السمة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في نشر السمة",
        variant: "destructive",
      });
    },
  });

  const expireMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/themes/${id}/expire`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes/active"] });
      toast({
        title: "تم الإنهاء",
        description: "تم إنهاء السمة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنهاء السمة",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/themes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف السمة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف السمة",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      review: "outline",
      scheduled: "default",
      active: "default",
      expired: "secondary",
      disabled: "destructive",
    };

    const labels: Record<string, string> = {
      draft: "مسودة",
      review: "قيد المراجعة",
      scheduled: "مجدولة",
      active: "نشطة",
      expired: "منتهية",
      disabled: "معطلة",
    };

    return (
      <Badge variant={variants[status] || "default"} data-testid={`badge-status-${status}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-theme-manager">إدارة السمات</h1>
            <p className="text-muted-foreground mt-2">
              إدارة السمات والهويات البصرية للمنصة
            </p>
          </div>
          <Button 
            onClick={() => setLocation("/dashboard/themes/new")}
            data-testid="button-create-theme"
          >
            <Plus className="h-4 w-4 ml-2" />
            سمة جديدة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>السمات المتاحة</CardTitle>
            <CardDescription>
              قائمة بجميع السمات المتاحة في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!themes || themes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4" data-testid="text-no-themes">
                  لا توجد سمات متاحة حالياً
                </p>
                <Button 
                  onClick={() => setLocation("/dashboard/themes/new")}
                  data-testid="button-create-first-theme"
                >
                  إنشاء أول سمة
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>افتراضية</TableHead>
                    <TableHead>النطاق</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {themes.map((theme) => (
                    <TableRow key={theme.id} data-testid={`row-theme-${theme.id}`}>
                      <TableCell className="font-medium" data-testid={`text-theme-name-${theme.id}`}>
                        {theme.name}
                      </TableCell>
                      <TableCell>{getStatusBadge(theme.status)}</TableCell>
                      <TableCell data-testid={`text-priority-${theme.id}`}>{theme.priority}</TableCell>
                      <TableCell>
                        {theme.isDefault ? (
                          <Badge variant="outline" data-testid={`badge-default-${theme.id}`}>افتراضية</Badge>
                        ) : null}
                      </TableCell>
                      <TableCell data-testid={`text-scope-${theme.id}`}>
                        {theme.applyTo?.join(", ") || "الكل"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setLocation(`/dashboard/themes/${theme.id}`)}
                            data-testid={`button-edit-${theme.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {theme.status === "draft" || theme.status === "review" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => publishMutation.mutate(theme.id)}
                              disabled={publishMutation.isPending}
                              data-testid={`button-publish-${theme.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {theme.status === "active" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => expireMutation.mutate(theme.id)}
                              disabled={expireMutation.isPending}
                              data-testid={`button-expire-${theme.id}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {!theme.isDefault && theme.status === "draft" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(theme.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${theme.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
