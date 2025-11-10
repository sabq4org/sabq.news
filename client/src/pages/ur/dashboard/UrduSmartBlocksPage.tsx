import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Blocks, Plus, Edit, Trash2 } from "lucide-react";
import type { UrSmartBlock, InsertUrSmartBlock } from "@shared/schema";
import { insertUrSmartBlockSchema } from "@shared/schema";

const placementOptions = [
  { value: 'below_featured', label: 'بینر کے نیچے' },
  { value: 'above_all_news', label: 'تمام خبروں سے اوپر' },
  { value: 'between_all_and_murqap', label: 'خبروں اور مرقاب کے درمیان' },
  { value: 'above_footer', label: 'فوٹر سے اوپر' },
] as const;

const typeOptions = [
  { value: 'news_list_summary', label: 'خبروں کی فہرست خلاصہ' },
  { value: 'quad_categories', label: 'چار زمرے' },
  { value: 'smart_summary', label: 'ذہین خلاصہ' },
  { value: 'hero_carousel', label: 'ہیرو کیروسل' },
] as const;

export default function UrduSmartBlocksPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<UrSmartBlock | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<InsertUrSmartBlock>({
    resolver: zodResolver(insertUrSmartBlockSchema),
    defaultValues: {
      title: '',
      type: 'news_list_summary',
      placement: 'below_featured',
      config: {},
      isActive: true,
      displayOrder: 0,
    },
  });

  const { data: blocks = [], isLoading } = useQuery<UrSmartBlock[]>({
    queryKey: ['/api/ur/smart-blocks'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUrSmartBlock) => {
      return await apiRequest('/api/ur/smart-blocks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ur/smart-blocks'] });
      toast({
        title: "بنایا گیا",
        description: "سمارٹ بلاک کامیابی سے بنایا گیا",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "خرابی",
        description: "سمارٹ بلاک بنانے میں ناکامی",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertUrSmartBlock }) => {
      return await apiRequest(`/api/ur/smart-blocks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ur/smart-blocks'] });
      toast({
        title: "اپ ڈیٹ کیا گیا",
        description: "سمارٹ بلاک کامیابی سے اپ ڈیٹ کیا گیا",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "خرابی",
        description: "سمارٹ بلاک اپ ڈیٹ کرنے میں ناکامی",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/ur/smart-blocks/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ur/smart-blocks'] });
      toast({
        title: "حذف کیا گیا",
        description: "سمارٹ بلاک کامیابی سے حذف کیا گیا",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "خرابی",
        description: "سمارٹ بلاک حذف کرنے میں ناکامی",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertUrSmartBlock) => {
    if (editingBlock) {
      updateMutation.mutate({ id: editingBlock.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (block: UrSmartBlock) => {
    setEditingBlock(block);
    form.reset({
      title: block.title,
      type: block.type,
      placement: block.placement,
      config: block.config || {},
      isActive: block.isActive,
      displayOrder: block.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBlock(null);
    form.reset({
      title: '',
      type: 'news_list_summary',
      placement: 'below_featured',
      config: {},
      isActive: true,
      displayOrder: 0,
    });
  };

  const getPlacementLabel = (placement: string) => {
    return placementOptions.find(opt => opt.value === placement)?.label || placement;
  };

  const getTypeLabel = (type: string) => {
    return typeOptions.find(opt => opt.value === type)?.label || type;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Blocks className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="heading-smart-blocks">
              سمارٹ بلاکس
            </h1>
          </div>
          <p className="text-muted-foreground mt-2">
            ہوم پیج پر حسب ضرورت مواد دکھانے کے لیے سمارٹ بلاکس کا نظم کریں
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBlock(null);
            form.reset({
              title: '',
              type: 'news_list_summary',
              placement: 'below_featured',
              config: {},
              isActive: true,
              displayOrder: 0,
            });
            setIsDialogOpen(true);
          }}
          data-testid="button-create-smart-block"
        >
          <Plus className="h-4 w-4 ml-2" />
          نیا بلاک بنائیں
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-stat-total">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              کل بلاکس
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-total">{blocks.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-active">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              فعال بلاکس
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
              غیر فعال بلاکس
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
          <CardTitle>تمام بلاکس</CardTitle>
          <CardDescription>
            سسٹم میں تمام سمارٹ بلاکس دیکھیں اور ان کا نظم کریں
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              لوڈ ہو رہا ہے...
            </div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Blocks className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>ابھی تک کوئی سمارٹ بلاکس نہیں</p>
              <p className="text-sm">شروع کرنے کے لیے "نیا بلاک بنائیں" پر کلک کریں</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">عنوان</TableHead>
                    <TableHead className="text-right">قسم</TableHead>
                    <TableHead className="text-right">جگہ</TableHead>
                    <TableHead className="text-right">ترتیب</TableHead>
                    <TableHead className="text-right">حالت</TableHead>
                    <TableHead className="text-right">اعمال</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.map((block) => (
                    <TableRow key={block.id} data-testid={`row-block-${block.id}`}>
                      <TableCell className="font-medium text-right" data-testid={`text-title-${block.id}`}>
                        {block.title}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-type-${block.id}`}>
                        <Badge variant="outline">{getTypeLabel(block.type)}</Badge>
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-placement-${block.id}`}>
                        {getPlacementLabel(block.placement)}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-order-${block.id}`}>
                        {block.displayOrder}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={block.isActive ? "default" : "secondary"}
                          data-testid={`badge-status-${block.id}`}
                        >
                          {block.isActive ? 'فعال' : 'غیر فعال'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(block)}
                            data-testid={`button-edit-block-${block.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(block.id)}
                            data-testid={`button-delete-block-${block.id}`}
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
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingBlock ? 'بلاک میں ترمیم کریں' : 'نیا بلاک بنائیں'}</DialogTitle>
            <DialogDescription>
              {editingBlock ? 'موجودہ سمارٹ بلاک کی تفصیلات اپ ڈیٹ کریں' : 'نیا سمارٹ بلاک بنائیں'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="بلاک کا عنوان درج کریں" data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قسم</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue placeholder="قسم منتخب کریں" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="placement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>جگہ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-placement">
                          <SelectValue placeholder="جگہ منتخب کریں" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {placementOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ترتیب</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        placeholder="0"
                        data-testid="input-display-order"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">فعال</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                  منسوخ کریں
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                  {(createMutation.isPending || updateMutation.isPending) ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>کیا آپ واقعی حذف کرنا چاہتے ہیں؟</AlertDialogTitle>
            <AlertDialogDescription>
              یہ عمل واپس نہیں ہو سکتا۔ یہ بلاک مستقل طور پر حذف ہو جائے گا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)} data-testid="button-cancel-delete">منسوخ کریں</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'حذف ہو رہا ہے...' : 'حذف کریں'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
