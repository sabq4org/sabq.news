import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Blocks, Plus, Edit, Trash2, Eye } from "lucide-react";
import type { SmartBlock, InsertSmartBlock } from "@shared/schema";
import { insertSmartBlockSchema } from "@shared/schema";
import { z } from "zod";

const placementOptions = [
  { value: 'below_featured', label: 'بعد البانر الرئيسي' },
  { value: 'above_all_news', label: 'قبل جميع الأخبار' },
  { value: 'between_all_and_murqap', label: 'بين الأخبار والمرقاب' },
  { value: 'above_footer', label: 'قبل التذييل' },
] as const;

export default function SmartBlocksPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<SmartBlock | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InsertSmartBlock>>({
    title: '',
    keyword: '',
    color: '#3B82F6',
    placement: 'below_featured',
    limitCount: 6,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: blocks = [], isLoading } = useQuery<SmartBlock[]>({
    queryKey: ['/api/smart-blocks'],
    queryFn: async () => {
      const res = await fetch('/api/smart-blocks', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch blocks');
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSmartBlock) => {
      return await apiRequest('/api/smart-blocks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-blocks'] });
      toast({
        title: "تم الإنشاء",
        description: "تم إنشاء البلوك الذكي بنجاح",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل إنشاء البلوك الذكي",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSmartBlock> }) => {
      return await apiRequest(`/api/smart-blocks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-blocks'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث البلوك الذكي بنجاح",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل تحديث البلوك الذكي",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/smart-blocks/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-blocks'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف البلوك الذكي بنجاح",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل حذف البلوك الذكي",
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    try {
      insertSmartBlockSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "خطأ في النموذج",
        description: "يرجى التحقق من جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    if (editingBlock) {
      updateMutation.mutate({ id: editingBlock.id, data: formData as InsertSmartBlock });
    } else {
      createMutation.mutate(formData as InsertSmartBlock);
    }
  };

  const handleEdit = (block: SmartBlock) => {
    setEditingBlock(block);
    setFormData({
      title: block.title,
      keyword: block.keyword,
      color: block.color,
      placement: block.placement as any,
      limitCount: block.limitCount,
      isActive: block.isActive,
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBlock(null);
    setFormData({
      title: '',
      keyword: '',
      color: '#3B82F6',
      placement: 'below_featured',
      limitCount: 6,
      isActive: true,
    });
    setFormErrors({});
  };

  const getPlacementLabel = (placement: string) => {
    return placementOptions.find(opt => opt.value === placement)?.label || placement;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Blocks className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold" data-testid="heading-smart-blocks">
                البلوكات الذكية
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              إدارة البلوكات الذكية لعرض محتوى مخصص في الصفحة الرئيسية
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingBlock(null);
              setFormData({
                title: '',
                keyword: '',
                color: '#3B82F6',
                placement: 'below_featured',
                limitCount: 6,
                isActive: true,
              });
              setFormErrors({});
              setIsDialogOpen(true);
            }}
            data-testid="button-create-block"
          >
            <Plus className="h-4 w-4 ml-2" />
            إنشاء بلوك جديد
          </Button>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-stat-total">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي البلوكات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-stat-total">{blocks.length}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-active">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                البلوكات النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-stat-active">
                {blocks.filter(b => b.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-inactive">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                البلوكات غير النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground" data-testid="text-stat-inactive">
                {blocks.filter(b => !b.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blocks Table */}
        <Card>
          <CardHeader>
            <CardTitle>جميع البلوكات</CardTitle>
            <CardDescription>
              عرض وإدارة جميع البلوكات الذكية في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                جاري التحميل...
              </div>
            ) : blocks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Blocks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد بلوكات ذكية حتى الآن</p>
                <p className="text-sm">انقر على "إنشاء بلوك جديد" للبدء</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اللون</TableHead>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">الكلمة المفتاحية</TableHead>
                      <TableHead className="text-right">الموضع</TableHead>
                      <TableHead className="text-right">العدد</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocks.map((block) => (
                      <TableRow key={block.id} data-testid={`row-block-${block.id}`}>
                        <TableCell>
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: block.color }}
                            data-testid={`color-preview-${block.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-title-${block.id}`}>
                          {block.title}
                        </TableCell>
                        <TableCell data-testid={`text-keyword-${block.id}`}>
                          <Badge variant="outline">{block.keyword}</Badge>
                        </TableCell>
                        <TableCell data-testid={`text-placement-${block.id}`}>
                          {getPlacementLabel(block.placement)}
                        </TableCell>
                        <TableCell data-testid={`text-limit-${block.id}`}>
                          {block.limitCount}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={block.isActive ? "default" : "secondary"}
                            data-testid={`badge-status-${block.id}`}
                          >
                            {block.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(block)}
                              data-testid={`button-edit-${block.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(block.id)}
                              data-testid={`button-delete-${block.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingBlock ? 'تعديل البلوك الذكي' : 'إنشاء بلوك ذكي جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingBlock 
                  ? 'قم بتعديل معلومات البلوك الذكي'
                  : 'أنشئ بلوك ذكي جديد لعرض محتوى مخصص'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">العنوان (60 حرف كحد أقصى)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: أخبار التقنية"
                  maxLength={60}
                  data-testid="input-title"
                />
                {formErrors.title && (
                  <p className="text-sm text-destructive">{formErrors.title}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.title?.length || 0} / 60
                </p>
              </div>

              {/* Keyword */}
              <div className="space-y-2">
                <Label htmlFor="keyword">الكلمة المفتاحية (100 حرف كحد أقصى)</Label>
                <Input
                  id="keyword"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="مثال: تقنية، ذكاء اصطناعي، برمجة"
                  maxLength={100}
                  data-testid="input-keyword"
                />
                {formErrors.keyword && (
                  <p className="text-sm text-destructive">{formErrors.keyword}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.keyword?.length || 0} / 100
                </p>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">اللون (HEX)</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                    data-testid="input-color"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setFormData({ ...formData, color: val });
                      }
                    }}
                    placeholder="#3B82F6"
                    maxLength={7}
                    className="flex-1"
                    data-testid="input-color-text"
                  />
                </div>
                {formErrors.color && (
                  <p className="text-sm text-destructive">{formErrors.color}</p>
                )}
              </div>

              {/* Placement */}
              <div className="space-y-2">
                <Label htmlFor="placement">الموضع في الصفحة الرئيسية</Label>
                <Select
                  value={formData.placement}
                  onValueChange={(value: any) => setFormData({ ...formData, placement: value })}
                >
                  <SelectTrigger data-testid="select-placement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {placementOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} data-testid={`option-placement-${option.value}`}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.placement && (
                  <p className="text-sm text-destructive">{formErrors.placement}</p>
                )}
              </div>

              {/* Limit Count */}
              <div className="space-y-2">
                <Label htmlFor="limitCount">عدد المقالات ({formData.limitCount})</Label>
                <Slider
                  id="limitCount"
                  min={1}
                  max={24}
                  step={1}
                  value={[formData.limitCount || 6]}
                  onValueChange={([value]) => setFormData({ ...formData, limitCount: value })}
                  data-testid="slider-limit"
                />
                <p className="text-xs text-muted-foreground">
                  سيتم عرض {formData.limitCount} مقالات في هذا البلوك
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">تفعيل البلوك</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-active"
                />
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                <p className="text-sm font-medium">معاينة مباشرة:</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: formData.color }}
                  />
                  <h3 
                    className="text-xl font-bold" 
                    style={{ color: formData.color }}
                    data-testid="preview-title"
                  >
                    {formData.title || 'عنوان البلوك'}
                  </h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>الكلمة المفتاحية: {formData.keyword || 'غير محدد'}</p>
                  <p>الموضع: {getPlacementLabel(formData.placement || 'below_featured')}</p>
                  <p>عدد المقالات: {formData.limitCount}</p>
                  <p>الحالة: {formData.isActive ? 'نشط' : 'غير نشط'}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'جاري الحفظ...'
                  : editingBlock
                  ? 'تحديث'
                  : 'إنشاء'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا البلوك الذكي؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
