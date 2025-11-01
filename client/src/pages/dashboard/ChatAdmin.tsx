import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, hasRole } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Hash,
  Users,
  Shield,
  Clock,
  Plus,
  MoreVertical,
  Settings,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChannelStats {
  id: string;
  name: string;
  type: "channel" | "direct";
  memberCount: number;
  messageCount: number;
  createdAt: Date;
  isActive: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  channelCount: number;
  lastActive: Date;
}

interface ModerationLog {
  id: string;
  action: string;
  targetUser: string;
  moderator: string;
  reason: string;
  timestamp: Date;
}

interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  retentionDays: number;
  channelTypes: string[];
  isActive: boolean;
}

export default function ChatAdmin() {
  const { user, isLoading: authLoading } = useAuth({ redirectToLogin: true });
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("channels");

  const { data: channels, isLoading: channelsLoading } = useQuery<ChannelStats[]>({
    queryKey: ["/api/chat/admin/channels"],
    enabled: !!user && hasRole(user, "admin", "chat_admin"),
  });

  const { data: members, isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/chat/admin/members"],
    enabled: !!user && hasRole(user, "admin", "chat_admin") && activeTab === "members",
  });

  const { data: logs, isLoading: logsLoading } = useQuery<ModerationLog[]>({
    queryKey: ["/api/chat/admin/moderation-logs"],
    enabled: !!user && hasRole(user, "admin", "chat_admin") && activeTab === "logs",
  });

  const { data: policies, isLoading: policiesLoading } = useQuery<RetentionPolicy[]>({
    queryKey: ["/api/chat/admin/retention-policies"],
    enabled: !!user && hasRole(user, "admin", "chat_admin") && activeTab === "retention",
  });

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]" data-testid="loading-state">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !hasRole(user, "admin", "chat_admin")) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]" data-testid="unauthorized-state">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground mb-4">
              ليس لديك الصلاحيات للوصول إلى إدارة الدردشة
            </p>
            <Button onClick={() => navigate("/dashboard")} data-testid="button-back-dashboard">
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="page-title">
              إدارة الدردشة
            </h1>
            <p className="text-muted-foreground mt-2" data-testid="page-description">
              إدارة القنوات والأعضاء وسجلات الإشراف
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="admin-tabs">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-list">
            <TabsTrigger value="channels" data-testid="tab-channels">
              <Hash className="h-4 w-4 ml-2" />
              القنوات
            </TabsTrigger>
            <TabsTrigger value="members" data-testid="tab-members">
              <Users className="h-4 w-4 ml-2" />
              الأعضاء
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <Shield className="h-4 w-4 ml-2" />
              سجلات الإشراف
            </TabsTrigger>
            <TabsTrigger value="retention" data-testid="tab-retention">
              <Clock className="h-4 w-4 ml-2" />
              سياسات الاحتفاظ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4" data-testid="content-channels">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>جميع القنوات</CardTitle>
                    <CardDescription>إدارة وإحصائيات قنوات الدردشة</CardDescription>
                  </div>
                  <Button data-testid="button-new-channel">
                    <Plus className="h-4 w-4 ml-2" />
                    قناة جديدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {channelsLoading ? (
                  <div className="space-y-3" data-testid="loading-channels">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : channels && channels.length > 0 ? (
                  <Table data-testid="channels-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">القناة</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">الأعضاء</TableHead>
                        <TableHead className="text-right">الرسائل</TableHead>
                        <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-left"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channels.map((channel) => (
                        <TableRow key={channel.id} data-testid={`channel-row-${channel.id}`}>
                          <TableCell className="font-medium" data-testid={`channel-name-${channel.id}`}>
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              {channel.name}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`channel-type-${channel.id}`}>
                            <Badge variant="outline">
                              {channel.type === "channel" ? "قناة" : "مباشر"}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`channel-members-${channel.id}`}>
                            {channel.memberCount.toLocaleString("en-US")}
                          </TableCell>
                          <TableCell data-testid={`channel-messages-${channel.id}`}>
                            {channel.messageCount.toLocaleString("en-US")}
                          </TableCell>
                          <TableCell data-testid={`channel-created-${channel.id}`}>
                            {formatDate(channel.createdAt)}
                          </TableCell>
                          <TableCell data-testid={`channel-status-${channel.id}`}>
                            <Badge variant={channel.isActive ? "default" : "secondary"}>
                              {channel.isActive ? "نشط" : "معطل"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`channel-actions-${channel.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem data-testid={`channel-settings-${channel.id}`}>
                                  <Settings className="h-4 w-4 ml-2" />
                                  الإعدادات
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  data-testid={`channel-delete-${channel.id}`}
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12" data-testid="empty-channels">
                    <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا توجد قنوات بعد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4" data-testid="content-members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>إدارة الأعضاء</CardTitle>
                    <CardDescription>إدارة أعضاء الدردشة وأدوارهم</CardDescription>
                  </div>
                  <Button data-testid="button-add-member">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة عضو
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-3" data-testid="loading-members">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : members && members.length > 0 ? (
                  <Table data-testid="members-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">البريد الإلكتروني</TableHead>
                        <TableHead className="text-right">الدور</TableHead>
                        <TableHead className="text-right">القنوات</TableHead>
                        <TableHead className="text-right">آخر نشاط</TableHead>
                        <TableHead className="text-left"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id} data-testid={`member-row-${member.id}`}>
                          <TableCell className="font-medium" data-testid={`member-name-${member.id}`}>
                            {member.name}
                          </TableCell>
                          <TableCell data-testid={`member-email-${member.id}`}>
                            {member.email}
                          </TableCell>
                          <TableCell data-testid={`member-role-${member.id}`}>
                            <Badge>{member.role}</Badge>
                          </TableCell>
                          <TableCell data-testid={`member-channels-${member.id}`}>
                            {member.channelCount.toLocaleString("en-US")}
                          </TableCell>
                          <TableCell data-testid={`member-last-active-${member.id}`}>
                            {formatDate(member.lastActive)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`member-actions-${member.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem data-testid={`member-edit-${member.id}`}>
                                  تحديث الدور
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  data-testid={`member-remove-${member.id}`}
                                >
                                  إزالة
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12" data-testid="empty-members">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا يوجد أعضاء بعد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4" data-testid="content-logs">
            <Card>
              <CardHeader>
                <CardTitle>سجلات الإشراف</CardTitle>
                <CardDescription>جميع إجراءات الإشراف على الدردشة</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-3" data-testid="loading-logs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : logs && logs.length > 0 ? (
                  <Table data-testid="logs-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الإجراء</TableHead>
                        <TableHead className="text-right">المستخدم المستهدف</TableHead>
                        <TableHead className="text-right">المشرف</TableHead>
                        <TableHead className="text-right">السبب</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                          <TableCell className="font-medium" data-testid={`log-action-${log.id}`}>
                            {log.action}
                          </TableCell>
                          <TableCell data-testid={`log-target-${log.id}`}>
                            {log.targetUser}
                          </TableCell>
                          <TableCell data-testid={`log-moderator-${log.id}`}>
                            {log.moderator}
                          </TableCell>
                          <TableCell data-testid={`log-reason-${log.id}`}>
                            {log.reason}
                          </TableCell>
                          <TableCell data-testid={`log-timestamp-${log.id}`}>
                            {formatDate(log.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12" data-testid="empty-logs">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا توجد سجلات إشراف</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="space-y-4" data-testid="content-retention">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>سياسات الاحتفاظ</CardTitle>
                    <CardDescription>إدارة سياسات الاحتفاظ بالرسائل</CardDescription>
                  </div>
                  <Button data-testid="button-new-policy">
                    <Plus className="h-4 w-4 ml-2" />
                    سياسة جديدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {policiesLoading ? (
                  <div className="space-y-3" data-testid="loading-policies">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : policies && policies.length > 0 ? (
                  <div className="space-y-4" data-testid="policies-list">
                    {policies.map((policy) => (
                      <Card key={policy.id} data-testid={`policy-card-${policy.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-base" data-testid={`policy-name-${policy.id}`}>
                                  {policy.name}
                                </CardTitle>
                                <Badge
                                  variant={policy.isActive ? "default" : "secondary"}
                                  data-testid={`policy-status-${policy.id}`}
                                >
                                  {policy.isActive ? "نشط" : "معطل"}
                                </Badge>
                              </div>
                              <CardDescription className="mt-2" data-testid={`policy-description-${policy.id}`}>
                                {policy.description}
                              </CardDescription>
                              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <span data-testid={`policy-retention-${policy.id}`}>
                                  <Clock className="h-4 w-4 inline ml-1" />
                                  {policy.retentionDays.toLocaleString("en-US")} يوم
                                </span>
                                <span data-testid={`policy-types-${policy.id}`}>
                                  أنواع القنوات: {policy.channelTypes.join("، ")}
                                </span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`policy-actions-${policy.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem data-testid={`policy-edit-${policy.id}`}>
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  data-testid={`policy-delete-${policy.id}`}
                                >
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="empty-policies">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا توجد سياسات احتفاظ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
