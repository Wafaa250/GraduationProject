import { Link } from "react-router-dom";
import { Pencil, RefreshCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CompanyProjectRequestDetail } from "@/api/companyApi";

type Props = {
  request: CompanyProjectRequestDetail;
  detailHref: string;
  regenerating: boolean;
  onRegenerate: () => void;
};

export function CompanyTeamRecommendationsEmptyState({
  request,
  detailHref,
  regenerating,
  onRegenerate,
}: Props) {
  const roleCount = request.roles.filter((r) => r.roleName?.trim()).length;

  return (
    <Card className="cw-card-elevated cw-team-state-panel overflow-hidden">
      <div className="h-1 cw-team-card-accent opacity-60" aria-hidden />
      <CardContent className="py-14 md:py-16 px-6 md:px-10">
        <div className="max-w-xl mx-auto text-center">
          <div className="cw-team-state-icon mb-6 mx-auto">
            <Users className="h-9 w-9" aria-hidden />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">No balanced team compositions yet</h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            SkillSwap evaluated your request but could not assemble complete teams that satisfy every
            role with strong compatibility. This usually improves when requirements or candidate depth
            changes.
          </p>
          <ul className="mt-6 text-left text-sm text-muted-foreground space-y-2.5 max-w-md mx-auto">
            <li className="flex gap-2">
              <span className="text-primary font-medium shrink-0">1.</span>
              <span>
                <span className="text-foreground font-medium">Insufficient matching candidates</span> for
                one or more roles ({roleCount} role{roleCount === 1 ? "" : "s"} requested).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-medium shrink-0">2.</span>
              <span>
                <span className="text-foreground font-medium">Role or skill requirements may be too strict</span>{" "}
                for the current student pool.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-medium shrink-0">3.</span>
              <span>
                <span className="text-foreground font-medium">Not enough compatible profiles yet</span> to
                form non-overlapping, high-chemistry teams.
              </span>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button
              className="rounded-xl cw-btn-gradient shadow-sm border-0 min-w-[200px]"
              onClick={onRegenerate}
              disabled={regenerating}
            >
              <RefreshCcw className={`h-4 w-4 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating teams…" : "Regenerate teams"}
            </Button>
            <Button asChild variant="outline" className="rounded-xl min-w-[200px]">
              <Link to={detailHref}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit request roles
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
