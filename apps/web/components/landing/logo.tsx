import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-primary",
        className
      )}
    >
      <div className="size-2.5 rounded-full border-2 border-primary-foreground" />
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 tracking-tight", className)}
    >
      <LogoMark className="size-8" />
      <span className="text-lg font-bold">FinanceLens</span>
    </Link>
  );
}
