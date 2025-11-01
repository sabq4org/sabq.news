import { useQuery } from "@tanstack/react-query";
import { Circle, Crown, Shield, User, MoreVertical, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChannelMember {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: "owner" | "admin" | "moderator" | "member";
  isOnline: boolean;
  lastSeen?: Date;
}

interface ChannelMembersListProps {
  channelId: string;
  currentUserRole: "owner" | "admin" | "moderator" | "member";
  onUpdateRole?: (userId: string, newRole: string) => void;
  onRemoveMember?: (userId: string) => void;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  moderator: Shield,
  member: User,
};

const roleLabels = {
  owner: "مالك",
  admin: "مشرف",
  moderator: "مشرف مساعد",
  member: "عضو",
};

const roleColors = {
  owner: "text-yellow-500",
  admin: "text-blue-500",
  moderator: "text-green-500",
  member: "text-muted-foreground",
};

function MemberItem({
  member,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
}: {
  member: ChannelMember;
  currentUserRole: string;
  onUpdateRole?: (userId: string, newRole: string) => void;
  onRemoveMember?: (userId: string) => void;
}) {
  const RoleIcon = roleIcons[member.role];
  const canManage =
    (currentUserRole === "owner" || currentUserRole === "admin") &&
    member.role !== "owner";

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-md hover-elevate"
      data-testid={`member-${member.userId}`}
    >
      <div className="relative">
        <Avatar className="h-10 w-10" data-testid={`avatar-${member.userId}`}>
          <AvatarImage src={member.userAvatar} />
          <AvatarFallback>{member.userName.charAt(0)}</AvatarFallback>
        </Avatar>
        <Circle
          className={cn(
            "h-3 w-3 absolute bottom-0 left-0",
            member.isOnline
              ? "fill-green-500 text-green-500"
              : "fill-gray-400 text-gray-400"
          )}
          data-testid={`presence-${member.userId}`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" data-testid={`name-${member.userId}`}>
          {member.userName}
        </p>
        <div className="flex items-center gap-2">
          <RoleIcon className={cn("h-3 w-3", roleColors[member.role])} />
          <span
            className={cn("text-xs", roleColors[member.role])}
            data-testid={`role-${member.userId}`}
          >
            {roleLabels[member.role]}
          </span>
        </div>
      </div>

      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid={`button-actions-${member.userId}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-testid={`menu-${member.userId}`}>
            <DropdownMenuLabel>إدارة العضو</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {currentUserRole === "owner" && (
              <>
                {member.role !== "admin" && (
                  <DropdownMenuItem
                    onClick={() => onUpdateRole?.(member.userId, "admin")}
                    data-testid={`action-make-admin-${member.userId}`}
                  >
                    <Shield className="h-4 w-4 ml-2" />
                    ترقية لمشرف
                  </DropdownMenuItem>
                )}
                {member.role !== "moderator" && member.role !== "admin" && (
                  <DropdownMenuItem
                    onClick={() => onUpdateRole?.(member.userId, "moderator")}
                    data-testid={`action-make-moderator-${member.userId}`}
                  >
                    <Shield className="h-4 w-4 ml-2" />
                    ترقية لمشرف مساعد
                  </DropdownMenuItem>
                )}
                {member.role !== "member" && (
                  <DropdownMenuItem
                    onClick={() => onUpdateRole?.(member.userId, "member")}
                    data-testid={`action-make-member-${member.userId}`}
                  >
                    <User className="h-4 w-4 ml-2" />
                    تخفيض لعضو
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              onClick={() => onRemoveMember?.(member.userId)}
              className="text-destructive"
              data-testid={`action-remove-${member.userId}`}
            >
              <UserX className="h-4 w-4 ml-2" />
              إزالة من القناة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function ChannelMembersList({
  channelId,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
}: ChannelMembersListProps) {
  const { data: members, isLoading } = useQuery<ChannelMember[]>({
    queryKey: ["/api/chat/channels", channelId, "members"],
  });

  const onlineMembers = members?.filter((m) => m.isOnline) || [];
  const offlineMembers = members?.filter((m) => !m.isOnline) || [];

  return (
    <div className="flex flex-col h-full bg-background border-r" dir="rtl">
      <div className="p-4 border-b">
        <h3 className="font-semibold" data-testid="members-title">
          الأعضاء
          {members && (
            <span className="text-muted-foreground mr-2" data-testid="members-count">
              ({members.length.toLocaleString("en-US")})
            </span>
          )}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3" data-testid="loading-state">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : members && members.length > 0 ? (
          <div className="p-2" data-testid="members-list">
            {onlineMembers.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  متصل الآن — {onlineMembers.length.toLocaleString("en-US")}
                </div>
                {onlineMembers.map((member) => (
                  <MemberItem
                    key={member.id}
                    member={member}
                    currentUserRole={currentUserRole}
                    onUpdateRole={onUpdateRole}
                    onRemoveMember={onRemoveMember}
                  />
                ))}
              </div>
            )}

            {offlineMembers.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  غير متصل — {offlineMembers.length.toLocaleString("en-US")}
                </div>
                {offlineMembers.map((member) => (
                  <MemberItem
                    key={member.id}
                    member={member}
                    currentUserRole={currentUserRole}
                    onUpdateRole={onUpdateRole}
                    onRemoveMember={onRemoveMember}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className="p-8 text-center text-muted-foreground"
            data-testid="empty-state"
          >
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">لا يوجد أعضاء</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
