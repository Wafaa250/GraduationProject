import { Inbox } from "lucide-react";

export function SupervisionRequestsEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-doctor-accent/25 bg-card py-16 text-center shadow-card">
      <div className="doctor-empty-illustration mb-4">
        <Inbox className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="font-display font-semibold text-foreground text-lg">
        No requests available.
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
        When students submit supervision or cancellation requests, they will appear here for review.
      </p>
    </div>
  );
}
