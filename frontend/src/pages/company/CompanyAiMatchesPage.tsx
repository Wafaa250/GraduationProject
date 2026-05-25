import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import { getCompanyProjectRequest } from "@/api/companyApi";
import { students, teams } from "@/data/companyMock";
import { requestTypeLabel } from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/routes/paths";

export function CompanyAiMatchesPage() {
  const [params] = useSearchParams();
  const defaultTab = params.get("type") === "teams" ? "teams" : "students";
  const requestId = params.get("request");
  const [linkedTitle, setLinkedTitle] = useState<string | null>(null);
  const [linkedType, setLinkedType] = useState<string | null>(null);

  useEffect(() => {
    const id = requestId ? Number(requestId) : NaN;
    if (!Number.isFinite(id) || id < 1) return;
    getCompanyProjectRequest(id)
      .then((r) => {
        setLinkedTitle(r.title);
        setLinkedType(requestTypeLabel(r.requestType));
      })
      .catch(() => {
        setLinkedTitle(null);
        setLinkedType(null);
      });
  }, [requestId]);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <CompanyPageHeader
        title="AI Matches"
        subtitle="Students and teams ranked by SkillSwap AI for your project requests — review fit and reach out."
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to={COMPANY_ROUTES.newRequest}>New request</Link>
          </Button>
        }
      />

      {linkedTitle && (
        <div className="cw-ai-panel rounded-2xl px-4 py-3 mb-6 text-sm flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>
            Matches for <strong>{linkedTitle}</strong>
            {linkedType ? ` (${linkedType})` : ""}
          </span>
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="students">Student matches</TabsTrigger>
          <TabsTrigger value="teams">Team matches</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {students.map((s) => (
              <Card key={s.id} className="cw-card-elevated hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <CompatibilityRing value={s.compatibility} size={52} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.specialization} · {s.university}
                      </div>
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        {s.availability}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{s.bio}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {s.skills.slice(0, 4).map((k) => (
                      <Badge key={k} variant="secondary" className="text-[10px]">
                        {k}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild size="sm" className="w-full mt-4 rounded-lg" variant="outline">
                    <Link to={COMPANY_ROUTES.messages}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Contact
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="grid md:grid-cols-2 gap-4">
            {teams.map((t) => (
              <Card key={t.id} className="cw-card-elevated">
                <CardContent className="p-5">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t.members.length} members · {t.categories.join(", ")}
                      </div>
                    </div>
                    <CompatibilityRing value={t.compatibility} size={48} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">{t.description}</p>
                  <Button asChild size="sm" className="mt-4 rounded-lg" variant="outline">
                    <Link to={COMPANY_ROUTES.messages}>Contact team</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
