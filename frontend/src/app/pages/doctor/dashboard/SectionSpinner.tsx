import { Loader2 } from "lucide-react";

export function SectionSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium m-0">{label ?? "Loading…"}</p>
    </div>
  );
}
