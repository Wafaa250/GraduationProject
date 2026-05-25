import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import { collabStatusClass } from "@/components/company/statusBadge";
import { collaborations } from "@/data/companyMock";
import { COMPANY_ROUTES } from "@/routes/paths";

export function CompanyCollaborationsPage() {
  const active = collaborations.filter((c) => c.status !== "Completed");
  const past = collaborations.filter((c) => c.status === "Completed");

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <CompanyPageHeader
        title="Collaborations"
        subtitle="Active partnerships with students and teams — lightweight status, not project management."
      />

      <h2 className="text-sm font-medium text-muted-foreground mb-3">Active & pending</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {active.map((c) => (
          <Card key={c.id} className="cw-card-elevated">
            <CardContent className="p-5">
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

      {past.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Completed</h2>
          <div className="space-y-2">
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
        </>
      )}
    </div>
  );
}
