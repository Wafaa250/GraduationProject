import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentAiMatchStatus } from "@/api/dashboardApi";
import { ROUTES } from "@/routes/paths";

type Props = {
  status: StudentAiMatchStatus | null;
  loading?: boolean;
  followingCompanyCount?: number;
  followingAssociationCount?: number;
  onNavigate?: () => void;
};

export function StudentAiMatchStatusCard({
  status,
  loading,
  followingCompanyCount = 0,
  followingAssociationCount = 0,
  onNavigate,
}: Props) {

  if (loading && !status) {
    return (
      <div className="student-sidebar-match-card student-sidebar-match-card--loading" aria-busy>
        <span className="student-sidebar-match-card__title">AI Match Status</span>
        <span className="student-sidebar-match-card__skeleton" />
      </div>
    );
  }

  if (!status) return null;

  const showEmpty = status.showEmptyState || !status.hasMatchInsights;
  const followingTotal = followingCompanyCount + followingAssociationCount;
  const companyLabel = followingCompanyCount === 1 ? "Company" : "Companies";
  const associationLabel = followingAssociationCount === 1 ? "Association" : "Associations";

  return (
    <section className="student-sidebar-match-card" aria-labelledby="student-ai-match-title">
      <div className="student-sidebar-match-card__header">
        <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <h3 id="student-ai-match-title" className="student-sidebar-match-card__title">
          AI Match Status
        </h3>
      </div>

      {showEmpty ? (
        <>
          <p className="student-sidebar-match-card__headline">{status.headline}</p>
          <p className="student-sidebar-match-card__insight">{status.insight}</p>
          <Button
            size="sm"
            variant="outline"
            className="student-sidebar-match-card__cta"
            asChild
          >
            <Link to={ROUTES.profile} onClick={onNavigate}>
              Edit Profile
            </Link>
          </Button>
        </>
      ) : (
        <>
          <p className="student-sidebar-match-card__headline">{status.headline}</p>
          <p className="student-sidebar-match-card__insight">{status.insight}</p>
          {status.availabilityStatus ? (
            <p className="student-sidebar-match-card__status">
              <span className="student-sidebar-match-card__status-label">Status:</span>{" "}
              {status.availabilityStatus}
            </p>
          ) : null}
        </>
      )}

      {followingTotal > 0 ? (
        <p className="student-sidebar-match-card__following">
          <span className="student-sidebar-match-card__status-label">Following:</span>{" "}
          <Link to={ROUTES.following} onClick={onNavigate} className="student-sidebar-match-card__following-link">
            {followingCompanyCount} {companyLabel}
          </Link>
          {followingCompanyCount > 0 && followingAssociationCount > 0 ? (
            <span className="student-sidebar-match-card__following-sep"> · </span>
          ) : null}
          {followingAssociationCount > 0 ? (
            <Link
              to={ROUTES.following}
              onClick={onNavigate}
              className="student-sidebar-match-card__following-link"
            >
              {followingAssociationCount} {associationLabel}
            </Link>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
