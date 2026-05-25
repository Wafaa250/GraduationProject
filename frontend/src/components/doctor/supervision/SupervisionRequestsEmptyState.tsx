import { Inbox } from "lucide-react";

export function SupervisionRequestsEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white py-16 text-center shadow-card">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4 mx-auto">
        <Inbox className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="font-display font-semibold text-foreground text-lg">
        No supervision requests available.
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
        When students submit supervision requests, they will appear here for review.
      </p>
    </div>
  );
}
