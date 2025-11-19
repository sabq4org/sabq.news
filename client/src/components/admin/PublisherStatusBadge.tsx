import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface PublisherStatusBadgeProps {
  status: "active" | "inactive";
  className?: string;
}

export function PublisherStatusBadge({ status, className }: PublisherStatusBadgeProps) {
  return (
    <Badge
      variant={status === "active" ? "default" : "destructive"}
      className={className}
      data-testid={`badge-status-${status}`}
    >
      {status === "active" ? (
        <>
          <CheckCircle className="h-3 w-3 mr-1" />
          نشط
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3 mr-1" />
          غير نشط
        </>
      )}
    </Badge>
  );
}
