import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Link2, Database, Tag } from "lucide-react";
import type { InsertEntityTypeDb, InsertSmartEntityDb, InsertSmartTermDb } from "@shared/schema";

interface EntityType {
  id: string;
  name: string;
  description: string | null;
}

interface SmartEntity {
  id: string;
  name: string;
  entityTypeId: string;
  url: string | null;
  description: string | null;
  entityTypeName?: string;
}

interface SmartTerm {
  id: string;
  term: string;
  entityId: string;
  entityName?: string;
}

export default function SmartLinksManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("entity-types");
  const [searchQuery, setSearchQuery] = useState("");

  // Entity Types state
  const [entityTypeDialogOpen, setEntityTypeDialogOpen] = useState(false);
  const [editingEntityType, setEditingEntityType] = useState<EntityType | null>(null);
  const [deleteEntityTypeId, setDeleteEntityTypeId] = useState<string | null>(null);

  // Smart Entities state
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<SmartEntity | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<string | null>(null);

  // Smart Terms state
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<SmartTerm | null>(null);
  const [deleteTermId, setDeleteTermId] = useState<string | null>(null);

  // Fetch Entity Types
  const { data: entityTypes = [], isLoading: entityTypesLoading } = useQuery<EntityType[]>({
    queryKey: ["/api/smart-entities/types"],
  });

  // Fetch Smart Entities
  const { data: smartEntities = [], isLoading: entitiesLoading } = useQuery<SmartEntity[]>({
    queryKey: ["/api/smart-entities"],
  });

  // Fetch Smart Terms
  const { data: smartTerms = [], isLoading: termsLoading } = useQuery<SmartTerm[]>({
    queryKey: ["/api/smart-terms"],
  });

  // Entity Type Mutations
  const createEntityTypeMutation = useMutation({
    mutationFn: async (data: InsertEntityTypeDb) => {
      return await apiRequest("/api/smart-entities/types", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-entities/types"] });
      setEntityTypeDialogOpen(false);
      toast({ title: "تم إنشاء نوع الكيان بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء إنشاء نوع الكيان", variant: "destructive" });
    },
  });

  const updateEntityTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertEntityTypeDb> }) => {
      return await apiRequest(`/api/smart-entities/types/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-entities/types"] });
      setEntityTypeDialogOpen(false);
      setEditingEntityType(null);
      toast({ title: "تم تحديث نوع الكيان بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء تحديث نوع الكيان", variant: "destructive" });
    },
  });

  const deleteEntityTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/smart-entities/types/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-entities/types"] });
      setDeleteEntityTypeId(null);
      toast({ title: "تم حذف نوع الكيان بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء حذف نوع الكيان", variant: "destructive" });
    },
  });

  // Smart Entity Mutations
  const createEntityMutation = useMutation({
    mutationFn: async (data: InsertSmartEntityDb) => {
      return await apiRequest("/api/smart-entities", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-entities"] });
      setEntityDialogOpen(false);
      toast({ title: "تم إنشاء الكيان بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء إنشاء الكيان", variant: "destructive" });
    },
  });

  const updateEntityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSmartEntityDb> }) => {
      return await apiRequest(`/api/smart-entities/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-entities"] });
      setEntityDialogOpen(false);
      setEditingEntity(null);
      toast({ title: "تم تحديث الكيان بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء تحديث الكيان", variant: "destructive" });
    },
  });

  const deleteEntityMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/smart-entities/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-entities"] });
      setDeleteEntityId(null);
      toast({ title: "تم حذف الكيان بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء حذف الكيان", variant: "destructive" });
    },
  });

  // Smart Term Mutations
  const createTermMutation = useMutation({
    mutationFn: async (data: InsertSmartTermDb) => {
      return await apiRequest("/api/smart-terms", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-terms"] });
      setTermDialogOpen(false);
      toast({ title: "تم إنشاء المصطلح بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء إنشاء المصطلح", variant: "destructive" });
    },
  });

  const updateTermMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSmartTermDb> }) => {
      return await apiRequest(`/api/smart-terms/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-terms"] });
      setTermDialogOpen(false);
      setEditingTerm(null);
      toast({ title: "تم تحديث المصطلح بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء تحديث المصطلح", variant: "destructive" });
    },
  });

  const deleteTermMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/smart-terms/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-terms"] });
      setDeleteTermId(null);
      toast({ title: "تم حذف المصطلح بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء حذف المصطلح", variant: "destructive" });
    },
  });

  // Filter data based on search
  const filteredEntityTypes = entityTypes.filter((type) =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEntities = smartEntities.filter((entity) =>
    entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entity.entityTypeName && entity.entityTypeName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTerms = smartTerms.filter((term) =>
    term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (term.entityName && term.entityName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold">الروابط الذكية</h1>
          <p className="text-muted-foreground mt-2">
            إدارة أنواع الكيانات والكيانات الذكية والمصطلحات المرتبطة بها
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entity-types" className="gap-2" data-testid="tab-entity-types">
              <Database className="h-4 w-4" />
              أنواع الكيانات
            </TabsTrigger>
            <TabsTrigger value="entities" className="gap-2" data-testid="tab-entities">
              <Link2 className="h-4 w-4" />
              الكيانات الذكية
            </TabsTrigger>
            <TabsTrigger value="terms" className="gap-2" data-testid="tab-terms">
              <Tag className="h-4 w-4" />
              المصطلحات
            </TabsTrigger>
          </TabsList>

          {/* Search Bar */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-search"
                />
              </div>
            </CardContent>
          </Card>

          {/* Entity Types Tab */}
          <TabsContent value="entity-types" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>أنواع الكيانات</CardTitle>
                    <CardDescription>
                      إدارة أنواع الكيانات المستخدمة في نظام الروابط الذكية
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingEntityType(null);
                      setEntityTypeDialogOpen(true);
                    }}
                    className="gap-2"
                    data-testid="button-add-entity-type"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة نوع جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {entityTypesLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : filteredEntityTypes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد أنواع كيانات
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead className="w-24">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntityTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {type.description || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingEntityType(type);
                                  setEntityTypeDialogOpen(true);
                                }}
                                data-testid={`button-edit-entity-type-${type.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteEntityTypeId(type.id)}
                                data-testid={`button-delete-entity-type-${type.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Entities Tab */}
          <TabsContent value="entities" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>الكيانات الذكية</CardTitle>
                    <CardDescription>
                      إدارة الكيانات الذكية والروابط المرتبطة بها
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingEntity(null);
                      setEntityDialogOpen(true);
                    }}
                    className="gap-2"
                    data-testid="button-add-entity"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة كيان جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {entitiesLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : filteredEntities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد كيانات ذكية
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>الرابط</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead className="w-24">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntities.map((entity) => (
                        <TableRow key={entity.id}>
                          <TableCell className="font-medium">{entity.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {entity.entityTypeName || "-"}
                          </TableCell>
                          <TableCell>
                            {entity.url ? (
                              <a
                                href={entity.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {entity.url.substring(0, 40)}...
                              </a>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entity.description ? entity.description.substring(0, 50) + "..." : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingEntity(entity);
                                  setEntityDialogOpen(true);
                                }}
                                data-testid={`button-edit-entity-${entity.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteEntityId(entity.id)}
                                data-testid={`button-delete-entity-${entity.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Terms Tab */}
          <TabsContent value="terms" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>المصطلحات الذكية</CardTitle>
                    <CardDescription>
                      إدارة المصطلحات المرتبطة بالكيانات الذكية
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingTerm(null);
                      setTermDialogOpen(true);
                    }}
                    className="gap-2"
                    data-testid="button-add-term"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مصطلح جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {termsLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : filteredTerms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مصطلحات ذكية
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المصطلح</TableHead>
                        <TableHead>الكيان المرتبط</TableHead>
                        <TableHead className="w-24">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTerms.map((term) => (
                        <TableRow key={term.id}>
                          <TableCell className="font-medium">{term.term}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {term.entityName || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingTerm(term);
                                  setTermDialogOpen(true);
                                }}
                                data-testid={`button-edit-term-${term.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTermId(term.id)}
                                data-testid={`button-delete-term-${term.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Entity Type Dialog */}
        <EntityTypeDialog
          open={entityTypeDialogOpen}
          onOpenChange={setEntityTypeDialogOpen}
          entityType={editingEntityType}
          onSave={(data) => {
            if (editingEntityType) {
              updateEntityTypeMutation.mutate({ id: editingEntityType.id, data });
            } else {
              createEntityTypeMutation.mutate(data as InsertEntityTypeDb);
            }
          }}
          isPending={createEntityTypeMutation.isPending || updateEntityTypeMutation.isPending}
        />

        {/* Smart Entity Dialog */}
        <SmartEntityDialog
          open={entityDialogOpen}
          onOpenChange={setEntityDialogOpen}
          entity={editingEntity}
          entityTypes={entityTypes}
          onSave={(data) => {
            if (editingEntity) {
              updateEntityMutation.mutate({ id: editingEntity.id, data });
            } else {
              createEntityMutation.mutate(data as InsertSmartEntityDb);
            }
          }}
          isPending={createEntityMutation.isPending || updateEntityMutation.isPending}
        />

        {/* Smart Term Dialog */}
        <SmartTermDialog
          open={termDialogOpen}
          onOpenChange={setTermDialogOpen}
          term={editingTerm}
          entities={smartEntities}
          onSave={(data) => {
            if (editingTerm) {
              updateTermMutation.mutate({ id: editingTerm.id, data });
            } else {
              createTermMutation.mutate(data as InsertSmartTermDb);
            }
          }}
          isPending={createTermMutation.isPending || updateTermMutation.isPending}
        />

        {/* Delete Confirmations */}
        <AlertDialog open={!!deleteEntityTypeId} onOpenChange={() => setDeleteEntityTypeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف نوع الكيان وجميع الكيانات المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteEntityTypeId && deleteEntityTypeMutation.mutate(deleteEntityTypeId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteEntityId} onOpenChange={() => setDeleteEntityId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف الكيان وجميع المصطلحات المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteEntityId && deleteEntityMutation.mutate(deleteEntityId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteTermId} onOpenChange={() => setDeleteTermId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف المصطلح. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTermId && deleteTermMutation.mutate(deleteTermId)}
                className="bg-destructive hover:bg-destructive/90"
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

// Entity Type Dialog Component
function EntityTypeDialog({
  open,
  onOpenChange,
  entityType,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType | null;
  onSave: (data: Partial<InsertEntityTypeDb>) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(entityType?.name || "");
  const [description, setDescription] = useState(entityType?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description: description || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {entityType ? "تعديل نوع الكيان" : "إضافة نوع كيان جديد"}
            </DialogTitle>
            <DialogDescription>
              أضف معلومات نوع الكيان أدناه
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: شخصية، منظمة، مكان"
                required
                data-testid="input-entity-type-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف نوع الكيان (اختياري)"
                rows={3}
                data-testid="input-entity-type-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-entity-type">
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Smart Entity Dialog Component
function SmartEntityDialog({
  open,
  onOpenChange,
  entity,
  entityTypes,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: SmartEntity | null;
  entityTypes: EntityType[];
  onSave: (data: Partial<InsertSmartEntityDb>) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(entity?.name || "");
  const [entityTypeId, setEntityTypeId] = useState(entity?.entityTypeId || "");
  const [url, setUrl] = useState(entity?.url || "");
  const [description, setDescription] = useState(entity?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      entityTypeId,
      url: url || null,
      description: description || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {entity ? "تعديل الكيان الذكي" : "إضافة كيان ذكي جديد"}
            </DialogTitle>
            <DialogDescription>
              أضف معلومات الكيان الذكي أدناه
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entity-name">الاسم *</Label>
              <Input
                id="entity-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: محمد بن سلمان، أرامكو"
                required
                data-testid="input-entity-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity-type">النوع *</Label>
              <Select value={entityTypeId} onValueChange={setEntityTypeId} required>
                <SelectTrigger data-testid="select-entity-type">
                  <SelectValue placeholder="اختر نوع الكيان" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity-url">الرابط</Label>
              <Input
                id="entity-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
                data-testid="input-entity-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity-description">الوصف</Label>
              <Textarea
                id="entity-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف الكيان (اختياري)"
                rows={3}
                data-testid="input-entity-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-entity">
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Smart Term Dialog Component
function SmartTermDialog({
  open,
  onOpenChange,
  term,
  entities,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: SmartTerm | null;
  entities: SmartEntity[];
  onSave: (data: Partial<InsertSmartTermDb>) => void;
  isPending: boolean;
}) {
  const [termText, setTermText] = useState(term?.term || "");
  const [entityId, setEntityId] = useState(term?.entityId || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      term: termText,
      entityId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {term ? "تعديل المصطلح" : "إضافة مصطلح جديد"}
            </DialogTitle>
            <DialogDescription>
              أضف معلومات المصطلح أدناه
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="term-text">المصطلح *</Label>
              <Input
                id="term-text"
                value={termText}
                onChange={(e) => setTermText(e.target.value)}
                placeholder="مثال: ولي العهد، شركة النفط"
                required
                data-testid="input-term-text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term-entity">الكيان المرتبط *</Label>
              <Select value={entityId} onValueChange={setEntityId} required>
                <SelectTrigger data-testid="select-term-entity">
                  <SelectValue placeholder="اختر الكيان" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-term">
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
