import { useState } from "react";
import { Compass, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell, CompanyPageSection } from "@/components/company/CompanyPageShell";
import { cwLayout } from "@/lib/companyLayout";
import { cn } from "@/lib/utils";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import { students, teams } from "@/data/companyMock";
import { COMPANY_ROUTES } from "@/routes/paths";
import { Link } from "react-router-dom";

export function CompanyDiscoverPage() {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.skills.some((k) => k.toLowerCase().includes(q)) ||
      s.specialization.toLowerCase().includes(q),
  );

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.combinedSkills.some((k) => k.toLowerCase().includes(q)),
  );

  return (
    <CompanyPageShell>
      <CompanyPageHeader
        title="Discover"
        subtitle="Browse students and teams on SkillSwap — explore beyond your current request matches."
      />

      <CompanyPageSection>
      <div className="relative max-w-xl">
        <Compass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by skill, name, or focus…"
          className="pl-9 rounded-xl"
        />
      </div>

      <Tabs defaultValue="students">
        <TabsList className="rounded-xl">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <div className={cn("grid md:grid-cols-2 lg:grid-cols-3", cwLayout.gridDense)}>
            {filteredStudents.map((s) => (
              <Card key={s.id} className="cw-card-elevated">
                <CardContent className={cwLayout.cardPadding}>
                  <div className="flex gap-3">
                    <CompatibilityRing value={s.compatibility} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.university}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {s.skills.slice(0, 3).map((k) => (
                      <Badge key={k} variant="secondary" className="text-[10px]">
                        {k}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full mt-3 rounded-lg">
                    <Link to={COMPANY_ROUTES.messages}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Message
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className={cn("grid md:grid-cols-2", cwLayout.gridDense)}>
            {filteredTeams.map((t) => (
              <Card key={t.id} className="cw-card-elevated">
                <CardContent className={cwLayout.cardPadding}>
                  <div className="flex justify-between">
                    <div className="font-medium">{t.name}</div>
                    <CompatibilityRing value={t.compatibility} size={40} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{t.description}</p>
                  <Button asChild size="sm" variant="outline" className="mt-3 rounded-lg">
                    <Link to={COMPANY_ROUTES.messages}>Message</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </CompanyPageSection>
    </CompanyPageShell>
  );
}
