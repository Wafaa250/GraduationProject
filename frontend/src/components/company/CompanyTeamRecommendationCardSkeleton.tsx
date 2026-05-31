import { Card, CardContent } from "@/components/ui/card";

export function CompanyTeamRecommendationCardSkeleton() {
  return (
    <Card className="cw-card-elevated border border-border/50">
      <CardContent className="p-5 space-y-3 animate-pulse">
        <div className="flex justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted/70" />
          </div>
          <div className="h-[52px] w-[52px] rounded-full bg-muted shrink-0" />
        </div>
        <div className="h-3 w-full rounded bg-muted/60" />
        <div className="flex -space-x-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-8 rounded-full bg-muted border-2 border-card" />
          ))}
        </div>
        <div className="flex gap-1">
          <div className="h-5 w-14 rounded-md bg-muted/60" />
          <div className="h-5 w-16 rounded-md bg-muted/60" />
          <div className="h-5 w-12 rounded-md bg-muted/60" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-8 rounded-lg bg-muted/50" />
          <div className="h-8 rounded-lg bg-muted/50" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-9 flex-1 rounded-xl bg-muted/70" />
          <div className="h-9 flex-1 rounded-xl bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CompanyTeamRecommendationsLoadingPanel({
  phase,
}: {
  phase: "initial" | "regenerating";
}) {
  const title = phase === "regenerating" ? "Refreshing teams" : "Building team matches";

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted-foreground">{title}…</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <CompanyTeamRecommendationCardSkeleton />
        <CompanyTeamRecommendationCardSkeleton />
        <CompanyTeamRecommendationCardSkeleton />
      </div>
    </div>
  );
}
