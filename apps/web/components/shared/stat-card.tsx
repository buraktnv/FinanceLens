import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardTone = "default" | "success" | "danger" | "warning";

const toneChipClasses: Record<StatCardTone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger",
  warning: "bg-warning/15 text-warning",
};

interface StatCardProps {
  title: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatCardTone;
}

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? (
          <CardAction
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              toneChipClasses[tone]
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-lg md:text-2xl font-bold tabular-nums truncate">
          {value}
        </div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
