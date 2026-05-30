import { Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { COMPANY_ROUTES } from "@/routes/paths";
import { CompanyWorkspaceEmptyState } from "@/components/company/CompanyWorkspaceEmptyState";

export function CompanySavedRecommendationsEmptyState() {
  return (
    <Card className="cw-card-elevated overflow-hidden">
      <div className="h-0.5 cw-team-card-accent opacity-80" aria-hidden />
      <CardContent className="cw-card-body">
        <CompanyWorkspaceEmptyState
          icon={Bookmark}
          eyebrow="Your shortlist"
          title="No saved recommendations yet"
          description="Save promising students and AI-built teams while reviewing matches. Your whole workspace shares this shortlist."
          steps={[
            {
              number: 1,
              title: "Run AI recommendations",
              description: "on a project request to discover candidates and teams.",
            },
            {
              number: 2,
              title: "Bookmark interesting profiles",
              description: "with the save button on any student or team card.",
            },
            {
              number: 3,
              title: "Review and add notes here",
              description: "before contacting candidates outside SkillSwap.",
            },
          ]}
          action={{ label: "Browse project requests", to: COMPANY_ROUTES.requests }}
          secondaryAction={{ label: "Create new request", to: COMPANY_ROUTES.newRequest }}
        />
      </CardContent>
    </Card>
  );
}
