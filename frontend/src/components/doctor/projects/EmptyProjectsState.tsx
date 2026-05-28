import { FolderOpen } from "lucide-react";

export function EmptyProjectsState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white/80 px-6 py-14 text-center shadow-card">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-primary/15 bg-gradient-soft">
        <FolderOpen className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">No active supervised projects yet.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Projects will appear here once supervision assignments are available.
      </p>
    </div>
  );
}
