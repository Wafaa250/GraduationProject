import { FolderOpen } from "lucide-react";

export function EmptyProjectsState() {
  return (
    <div className="rounded-2xl border border-dashed border-doctor-accent/25 bg-card px-6 py-14 text-center shadow-card">
      <div className="doctor-empty-illustration doctor-empty-illustration--lg mb-4">
        <FolderOpen className="h-9 w-9" aria-hidden />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">No active supervised projects yet.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Projects will appear here once supervision assignments are available.
      </p>
    </div>
  );
}
