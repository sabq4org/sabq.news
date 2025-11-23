import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { IFoxLayout } from "@/components/admin/ifox/IFoxLayout";
import { IFoxUploader } from "@/components/admin/ifox/IFoxUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import {
  Image,
  Video,
  FileAudio,
  FileText,
  Search,
  Filter,
  Upload,
  Trash2,
  Eye,
  Download,
  Copy,
  Edit,
  X,
  Grid,
  List,
  HardDrive,
  FolderOpen,
  Calendar,
  User,
  SortAsc,
  SortDesc,
  ImagePlus,
  Sparkles,
  Brain,
  MessageSquare,
  Cpu,
  GraduationCap,
  Users,
  Lightbulb
} from "lucide-react";

interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document";
  url: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  category: string;
  tags: string[];
  altText?: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  usageCount: number;
}

interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
}

const categoryIcons = {
  "ai-news": Sparkles,
  "ai-voice": MessageSquare,
  "ai-tools": Cpu,
  "ai-academy": GraduationCap,
  "ai-community": Users,
  "ai-insights": Lightbulb,
  "ai-opinions": Eye
};

const categoryColors = {
  "ai-news": "from-violet-500 to-purple-600",
  "ai-voice": "from-blue-500 to-cyan-600",
  "ai-tools": "from-pink-500 to-rose-600",
  "ai-academy": "from-amber-500 to-orange-600",
  "ai-community": "from-green-500 to-emerald-600",
  "ai-insights": "from-indigo-500 to-purple-600",
  "ai-opinions": "from-red-500 to-pink-600"
};

export default function IFoxMedia() {
  useRoleProtection('admin');
  const { toast } = useToast();
  
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Fetch media files
  const { data: files = [], isLoading, error: filesError } = useQuery<MediaFile[]>({
    queryKey: ["/api/admin/ifox/media", { type: selectedType, category: selectedCategory, search: searchQuery, sortBy, sortOrder }]
  });

  // Fetch storage info
  const { data: storageInfo, error: storageError } = useQuery<StorageInfo>({
    queryKey: ["/api/admin/ifox/media/storage"]
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return apiRequest(`/api/admin/ifox/media/${fileId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ifox/media"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الملف بنجاح",
      });
      setSelectedFile(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل حذف الملف",
        variant: "destructive",
      });
    }
  });

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: async (file: MediaFile) => {
      return apiRequest(`/api/admin/ifox/media/${file.id}`, {
        method: "PUT",
        body: JSON.stringify(file),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ifox/media"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث معلومات الملف بنجاح",
      });
      setEditingFile(null);
      setSelectedFile(null);
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return Image;
      case "video": return Video;
      case "audio": return FileAudio;
      case "document": return FileText;
      default: return FileText;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ الرابط إلى الحافظة",
    });
  };

  const filteredFiles = files.filter(file => {
    const matchesType = selectedType === "all" || file.type === selectedType;
    const matchesCategory = selectedCategory === "all" || file.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesCategory && matchesSearch;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "date":
        comparison = new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        break;
      case "size":
        comparison = b.size - a.size;
        break;
    }
    return sortOrder === "desc" ? comparison : -comparison;
  });

  const handleBulkDelete = () => {
    if (selectedFiles.size === 0) return;
    
    // Implement bulk delete
    selectedFiles.forEach(fileId => {
      deleteFileMutation.mutate(fileId);
    });
    setSelectedFiles(new Set());
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-violet-950/20">
      {/* Sidebar */}
      <IFoxSidebar className="hidden lg:block" />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-600 shadow-lg shadow-violet-500/30">
                    <Image className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      مكتبة الوسائط
                    </h1>
                    <p className="text-white/60">إدارة ملفات الوسائط المتعددة</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedFiles.size > 0 && (
                    <Button
                      variant="destructive"
                      onClick={handleBulkDelete}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف المحدد ({selectedFiles.size})
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsUploaderOpen(true)}
                    className="gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700"
                  >
                    <Upload className="w-4 h-4" />
                    رفع ملفات جديدة
                  </Button>
                </div>
              </div>

              {/* Storage Info */}
              {storageInfo && (
                <Card className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-violet-400" />
                        <span className="text-white/80">استخدام المساحة</span>
                      </div>
                      <span className="text-white/60 text-sm">
                        {formatFileSize(storageInfo.used)} من {formatFileSize(storageInfo.total)}
                      </span>
                    </div>
                    <Progress value={storageInfo.percentage} className="h-2 bg-white/10" />
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Filters and Search */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[300px] relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    placeholder="بحث بالاسم أو الكلمات المفتاحية..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="image">صور</SelectItem>
                    <SelectItem value="video">فيديو</SelectItem>
                    <SelectItem value="audio">صوت</SelectItem>
                    <SelectItem value="document">مستندات</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التصنيفات</SelectItem>
                    <SelectItem value="ai-news">أخبار AI</SelectItem>
                    <SelectItem value="ai-voice">AI Voice</SelectItem>
                    <SelectItem value="ai-tools">AI Tools</SelectItem>
                    <SelectItem value="ai-academy">AI Academy</SelectItem>
                    <SelectItem value="ai-community">AI Community</SelectItem>
                    <SelectItem value="ai-insights">AI Insights</SelectItem>
                    <SelectItem value="ai-opinions">AI Opinions</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">الاسم</SelectItem>
                    <SelectItem value="date">التاريخ</SelectItem>
                    <SelectItem value="size">الحجم</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="text-white/60 hover:text-white"
                >
                  {sortOrder === "asc" ? <SortAsc /> : <SortDesc />}
                </Button>

                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Media Grid/List */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {sortedFiles.map((file) => {
                    const Icon = getFileIcon(file.type);
                    const CategoryIcon = categoryIcons[file.category as keyof typeof categoryIcons];
                    const isSelected = selectedFiles.has(file.id);
                    
                    return (
                      <motion.div
                        key={file.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "group relative rounded-xl overflow-hidden bg-white/5 border border-white/10",
                          "hover:border-white/20 transition-all duration-200 cursor-pointer",
                          isSelected && "border-violet-500 bg-violet-500/10"
                        )}
                        onClick={() => setSelectedFile(file)}
                      >
                        <div className="aspect-square relative">
                          {file.type === "image" && file.thumbnailUrl ? (
                            <img
                              src={file.thumbnailUrl}
                              alt={file.altText || file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                              <Icon className="w-12 h-12 text-white/40" />
                            </div>
                          )}
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                              <p className="text-white text-sm font-medium truncate">{file.name}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-white/60 text-xs">{formatFileSize(file.size)}</span>
                                {CategoryIcon && (
                                  <CategoryIcon className="w-4 h-4 text-white/60" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Selection Checkbox */}
                          <div className="absolute top-2 left-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                const newSelected = new Set(selectedFiles);
                                if (isSelected) {
                                  newSelected.delete(file.id);
                                } else {
                                  newSelected.add(file.id);
                                }
                                setSelectedFiles(newSelected);
                              }}
                              className="w-4 h-4 rounded border-white/30 bg-white/10"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Usage Badge */}
                          {file.usageCount > 0 && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                                {file.usageCount}x
                              </Badge>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedFiles.map((file) => {
                    const Icon = getFileIcon(file.type);
                    const CategoryIcon = categoryIcons[file.category as keyof typeof categoryIcons];
                    const isSelected = selectedFiles.has(file.id);
                    
                    return (
                      <motion.div
                        key={file.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10",
                          "hover:border-white/20 transition-all duration-200 cursor-pointer",
                          isSelected && "border-violet-500 bg-violet-500/10"
                        )}
                        onClick={() => setSelectedFile(file)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newSelected = new Set(selectedFiles);
                            if (isSelected) {
                              newSelected.delete(file.id);
                            } else {
                              newSelected.add(file.id);
                            }
                            setSelectedFiles(newSelected);
                          }}
                          className="w-4 h-4 rounded border-white/30 bg-white/10"
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white/60" />
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-white font-medium">{file.name}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-white/60 text-sm">{formatFileSize(file.size)}</span>
                            <span className="text-white/60 text-sm">
                              {format(new Date(file.uploadedAt), "d MMM yyyy", { locale: ar })}
                            </span>
                            {CategoryIcon && (
                              <div className="flex items-center gap-1">
                                <CategoryIcon className="w-3 h-3 text-white/60" />
                                <span className="text-white/60 text-sm">{file.category}</span>
                              </div>
                            )}
                            {file.usageCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                استخدم {file.usageCount} مرة
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(file.url);
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(file.url, "_blank");
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </ScrollArea>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploaderOpen} onOpenChange={setIsUploaderOpen}>
        <DialogContent className="max-w-3xl bg-gradient-to-br from-slate-950 via-purple-950/50 to-violet-950/30 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">رفع ملفات جديدة</DialogTitle>
            <DialogDescription className="text-white/60">
              اسحب وأفلت الملفات أو انقر للاختيار
            </DialogDescription>
          </DialogHeader>
          <IFoxUploader
            onUploadComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/admin/ifox/media"] });
              setIsUploaderOpen(false);
            }}
            onCancel={() => setIsUploaderOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* File Details Dialog */}
      <AnimatePresence>
        {selectedFile && !editingFile && (
          <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
            <DialogContent className="max-w-4xl bg-gradient-to-br from-slate-950 via-purple-950/50 to-violet-950/30 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">تفاصيل الملف</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="space-y-4">
                  {selectedFile.type === "image" && selectedFile.url ? (
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.altText || selectedFile.name}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="aspect-square rounded-lg bg-white/5 flex items-center justify-center">
                      {(() => {
                        const Icon = getFileIcon(selectedFile.type);
                        return <Icon className="w-24 h-24 text-white/40" />;
                      })()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/60">اسم الملف</Label>
                    <p className="text-white mt-1">{selectedFile.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/60">الحجم</Label>
                      <p className="text-white mt-1">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    {selectedFile.width && selectedFile.height && (
                      <div>
                        <Label className="text-white/60">الأبعاد</Label>
                        <p className="text-white mt-1">{selectedFile.width} × {selectedFile.height}</p>
                      </div>
                    )}
                    {selectedFile.duration && (
                      <div>
                        <Label className="text-white/60">المدة</Label>
                        <p className="text-white mt-1">{Math.floor(selectedFile.duration / 60)}:{(selectedFile.duration % 60).toString().padStart(2, '0')}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-white/60">التصنيف</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const CategoryIcon = categoryIcons[selectedFile.category as keyof typeof categoryIcons];
                        return CategoryIcon ? <CategoryIcon className="w-4 h-4 text-white/60" /> : null;
                      })()}
                      <span className="text-white">{selectedFile.category}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/60">الكلمات المفتاحية</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedFile.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-white/10 text-white">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedFile.altText && (
                    <div>
                      <Label className="text-white/60">النص البديل</Label>
                      <p className="text-white mt-1">{selectedFile.altText}</p>
                    </div>
                  )}

                  {selectedFile.caption && (
                    <div>
                      <Label className="text-white/60">الوصف</Label>
                      <p className="text-white mt-1">{selectedFile.caption}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/60">رفع بواسطة</Label>
                      <p className="text-white mt-1">{selectedFile.uploadedBy}</p>
                    </div>
                    <div>
                      <Label className="text-white/60">تاريخ الرفع</Label>
                      <p className="text-white mt-1">
                        {format(new Date(selectedFile.uploadedAt), "d MMM yyyy, h:mm a", { locale: ar })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/60">رابط الملف</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={selectedFile.url}
                        readOnly
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(selectedFile.url)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingFile(selectedFile)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  تحرير
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("هل أنت متأكد من حذف هذا الملف؟")) {
                      deleteFileMutation.mutate(selectedFile.id);
                    }
                  }}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                >
                  إغلاق
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Edit File Dialog */}
      <AnimatePresence>
        {editingFile && (
          <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
            <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-950 via-purple-950/50 to-violet-950/30 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">تحرير معلومات الملف</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-white/60">اسم الملف</Label>
                  <Input
                    value={editingFile.name}
                    onChange={(e) => setEditingFile({ ...editingFile, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white/60">التصنيف</Label>
                  <Select
                    value={editingFile.category}
                    onValueChange={(value) => setEditingFile({ ...editingFile, category: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai-news">أخبار AI</SelectItem>
                      <SelectItem value="ai-voice">AI Voice</SelectItem>
                      <SelectItem value="ai-tools">AI Tools</SelectItem>
                      <SelectItem value="ai-academy">AI Academy</SelectItem>
                      <SelectItem value="ai-community">AI Community</SelectItem>
                      <SelectItem value="ai-insights">AI Insights</SelectItem>
                      <SelectItem value="ai-opinions">AI Opinions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white/60">الكلمات المفتاحية</Label>
                  <Input
                    value={editingFile.tags.join(", ")}
                    onChange={(e) => setEditingFile({
                      ...editingFile,
                      tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag)
                    })}
                    placeholder="أدخل الكلمات مفصولة بفواصل"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {editingFile.type === "image" && (
                  <div>
                    <Label className="text-white/60">النص البديل</Label>
                    <Input
                      value={editingFile.altText || ""}
                      onChange={(e) => setEditingFile({ ...editingFile, altText: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-white/60">الوصف</Label>
                  <Textarea
                    value={editingFile.caption || ""}
                    onChange={(e) => setEditingFile({ ...editingFile, caption: e.target.value })}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  onClick={() => updateFileMutation.mutate(editingFile)}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700"
                >
                  حفظ التغييرات
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setEditingFile(null)}
                >
                  إلغاء
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}