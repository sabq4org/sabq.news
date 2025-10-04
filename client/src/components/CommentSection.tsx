import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send } from "lucide-react";
import type { CommentWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

interface CommentSectionProps {
  articleId: string;
  comments: CommentWithUser[];
  currentUser?: { 
    id: string; 
    email?: string; 
    firstName?: string | null;
    lastName?: string | null;
  };
  onSubmitComment?: (content: string, parentId?: string) => void;
}

export function CommentSection({ 
  articleId, 
  comments,
  currentUser, 
  onSubmitComment 
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onSubmitComment?.(newComment, undefined);
      setNewComment("");
    }
  };

  const handleReply = (parentId: string) => {
    if (replyContent.trim()) {
      onSubmitComment?.(replyContent, parentId);
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'م';
  };

  const renderComment = (comment: CommentWithUser, isReply = false) => (
    <div 
      key={comment.id} 
      className={`${isReply ? 'mr-8 mt-3' : 'mb-4'}`}
      data-testid={`comment-${comment.id}`}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(comment.user.firstName, comment.user.lastName, comment.user.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm" data-testid={`text-comment-author-${comment.id}`}>
                {comment.user.firstName && comment.user.lastName
                  ? `${comment.user.firstName} ${comment.user.lastName}`
                  : comment.user.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: arSA,
                })}
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" data-testid={`text-comment-content-${comment.id}`}>
              {comment.content}
            </p>
          </div>

          {currentUser && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs hover-elevate"
              onClick={() => setReplyingTo(comment.id)}
              data-testid={`button-reply-${comment.id}`}
            >
              رد
            </Button>
          )}

          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                placeholder="اكتب ردك..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
                data-testid={`textarea-reply-${comment.id}`}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyContent.trim()}
                  data-testid={`button-submit-reply-${comment.id}`}
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                  data-testid={`button-cancel-reply-${comment.id}`}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card id="comments">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          التعليقات ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentUser ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(currentUser.firstName, currentUser.lastName, currentUser.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="شارك برأيك..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                  data-testid="textarea-new-comment"
                />
              </div>
            </div>
            <div className="flex justify-start">
              <Button 
                type="submit" 
                disabled={!newComment.trim()}
                className="gap-2"
                data-testid="button-submit-comment"
              >
                <Send className="h-4 w-4" />
                نشر التعليق
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">سجل الدخول لإضافة تعليق</p>
            <Button asChild data-testid="button-login-to-comment">
              <a href="/api/login">تسجيل الدخول</a>
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.filter(c => !c.parentId).map((comment) => renderComment(comment))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد تعليقات بعد. كن أول من يعلق!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
