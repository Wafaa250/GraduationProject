import { Link } from "react-router-dom";
import { Bookmark, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COMPANY_ROUTES } from "@/routes/paths";

export function CompanySavedRecommendationsEmptyState() {
  return (
    <Card className="cw-card-elevated overflow-hidden">
      <div className="cw-accent-bar" aria-hidden />
      <CardContent className="py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-lg mx-auto text-center">
          <div className="cw-team-state-icon mb-6 mx-auto">
            <Bookmark className="h-9 w-9" aria-hidden />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">
            Your shortlist
          </p>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
            No saved recommendations yet
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Save promising students and AI-built teams while reviewing matches. Your whole workspace
            shares this shortlist — add notes and come back before reaching out externally.
          </p>
          <ul className="mt-8 text-left text-sm text-muted-foreground space-y-3 max-w-md mx-auto">
            <li className="flex gap-3">
              <span className="cw-step-number">
                1
              </span>
              <span>
                <span className="text-foreground font-medium">Run AI recommendations</span> on a project
                request to discover candidates and teams.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="cw-step-number">
                2
              </span>
              <span>
                <span className="text-foreground font-medium">Bookmark interesting profiles</span> with
                the save button on any student or team card.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="cw-step-number">
                3
              </span>
              <span>
                <span className="text-foreground font-medium">Review and add notes here</span> before
                contacting candidates outside SkillSwap.
              </span>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button asChild className="rounded-xl cw-btn-gradient shadow-sm border-0 min-w-[220px]">
              <Link to={COMPANY_ROUTES.requests}>
                <Sparkles className="h-4 w-4 mr-1.5" />
                Browse project requests
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl min-w-[220px]">
              <Link to={COMPANY_ROUTES.newRequest}>
                Create new request
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
