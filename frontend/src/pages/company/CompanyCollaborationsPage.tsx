import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell, CompanyPageSection } from "@/components/company/CompanyPageShell";
import { cwLayout } from "@/lib/companyLayout";
import { cn } from "@/lib/utils";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import { collabStatusClass } from "@/components/company/statusBadge";
import { collaborations } from "@/data/companyMock";
import { COMPANY_ROUTES } from "@/routes/paths";

export function CompanyCollaborationsPage() {
  const active = collaborations.filter((c) => c.status !== "Completed");
  const past = collaborations.filter((c) => c.status === "Completed");

  return (
    <CompanyPageShell>
      <CompanyPageHeader
        title="Collaborations"
        subtitle="Active partnerships with students and teams — lightweight status, not project management."
      />

      <CompanyPageSection>
        <h2 className="text-sm font-medium text-muted-foreground">Active & pending</h2>
        <div className={cn("grid md:grid-cols-2", cwLayout.gridDense)}>
          {active.map((c) => (
            <Card key={c.id} className="cw-card-elevated cw-candidate-card">
              <CardContent className={cwLayout.cardPadding}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{c.participant}</div>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {c.participantType}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2 truncate">{c.request}</p>
                    <p className="text-xs text-muted-foreground mt-1">Started {c.startDate}</p>
                  </div>
                  <CompatibilityRing value={c.compatibility} size={44} />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge className={collabStatusClass(c.status)}>{c.status}</Badge>
                  <Button asChild size="sm" variant="outline" className="rounded-lg">
                    <Link to={COMPANY_ROUTES.messages}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Message
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CompanyPageSection>

      {past.length > 0 && (
        <CompanyPageSection>
          <h2 className="text-sm font-medium text-muted-foreground">Completed</h2>
          <div className={cwLayout.section}>
            {past.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-secondary/30"
              >
                <span className="font-medium text-sm">{c.participant}</span>
                <span className="text-xs text-muted-foreground flex-1 min-w-[120px]">{c.request}</span>
                <Badge variant="outline">{c.status}</Badge>
              </div>
            ))}
          </div>
        </CompanyPageSection>
      )}
    </CompanyPageShell>
  );
}
