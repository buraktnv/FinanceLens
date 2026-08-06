import { Loader2, Wallet } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Wallet className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
      </div>
    </div>
  );
}
