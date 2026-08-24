import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
}

const rowWidths = ["w-full", "w-11/12", "w-5/6", "w-full", "w-4/5", "w-11/12"];

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <Card aria-hidden="true">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-3 overflow-hidden">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn("h-9", rowWidths[index % rowWidths.length])}
          />
        ))}
      </CardContent>
    </Card>
  );
}
