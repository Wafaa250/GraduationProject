import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CompanyPageHeader } from "@/components/company/PageHeader";

export function CompanySettingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <CompanyPageHeader title="Settings" subtitle="Workspace preferences for your company account." />

      <Card className="cw-card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              l: "New AI matches",
              d: "When SkillSwap finds strong student or team matches for your requests.",
            },
            {
              l: "Collaboration responses",
              d: "When a student or team responds to your outreach.",
            },
            { l: "Weekly activity digest", d: "Summary of requests, matches, and messages." },
          ].map((s) => (
            <div key={s.l} className="flex items-center justify-between gap-4">
              <div>
                <Label>{s.l}</Label>
                <div className="text-xs text-muted-foreground">{s.d}</div>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="cw-card-elevated mt-6">
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Company profile data is managed from your onboarding record. Matching preferences will
          sync with future request defaults.
        </CardContent>
      </Card>
    </div>
  );
}
