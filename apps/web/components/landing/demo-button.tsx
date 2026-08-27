"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoButtonProps {
  onDemo: () => void;
  loading: boolean;
  variant?: "secondary" | "outline" | "default";
  className?: string;
}

export function DemoButton({
  onDemo,
  loading,
  variant = "secondary",
  className,
}: DemoButtonProps) {
  return (
    <Button
      type="button"
      size="lg"
      variant={variant}
      className={className}
      onClick={onDemo}
      disabled={loading}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      {loading ? "Yönlendiriliyor…" : "Demoyu Dene"}
    </Button>
  );
}
