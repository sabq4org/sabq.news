import { Users, FileText, Clock, Crown, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamActivity, TeamMemberActivity } from "@shared/schema";

interface TeamActivityCardProps {
  data?: TeamActivity;
  isLoading?: boolean;
}

function MemberRow({ member, isTop }: { member: TeamMemberActivity; isTop?: boolean }) {
  const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div 
      className={`flex items-center gap-3 p-2 rounded-lg ${isTop ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-muted/30'}`}
      data-testid={`team-member-${member.userId}`}
    >
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        {isTop && (
          <Crown className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" data-testid="icon-top-publisher" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" data-testid={`text-member-name-${member.userId}`}>
          {member.name}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs" data-testid={`badge-published-${member.userId}`}>
          {member.publishedToday} منشور
        </Badge>
        {member.pendingArticles > 0 && (
          <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400" data-testid={`badge-pending-${member.userId}`}>
            {member.pendingArticles} معلق
          </Badge>
        )}
      </div>
    </div>
  );
}

export function TeamActivityCard({ data, isLoading }: TeamActivityCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="team-activity-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            نشاط الفريق
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card data-testid="team-activity-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" data-testid="title-team-activity">
          <Users className="h-5 w-5 text-primary" />
          نشاط الفريق
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="text-total-published">
              {data.totalPublishedToday}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              منشور اليوم
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300" data-testid="text-total-pending">
              {data.totalPendingArticles}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              معلق
            </p>
          </div>
        </div>

        {data.topPublisher && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2" data-testid="title-top-publisher">
              <Crown className="h-4 w-4 text-amber-500" />
              الأكثر نشراً اليوم
            </h4>
            <MemberRow member={data.topPublisher} isTop />
          </div>
        )}

        {data.members.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium" data-testid="title-team-members">
              الفريق
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.members.slice(1, 5).map((member) => (
                <MemberRow key={member.userId} member={member} />
              ))}
            </div>
          </div>
        )}

        {data.members.length === 0 && (
          <p className="text-center text-muted-foreground py-4 text-sm" data-testid="text-no-team-activity">
            لا يوجد نشاط اليوم بعد
          </p>
        )}
      </CardContent>
    </Card>
  );
}
