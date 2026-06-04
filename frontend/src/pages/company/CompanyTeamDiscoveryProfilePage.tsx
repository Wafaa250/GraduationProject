import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bookmark, Mail, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyDiscoveryProfileHero } from "@/components/company/CompanyDiscoveryProfileHero";
import { CompanyLuxSection } from "@/components/company/CompanyLuxSection";
import { CompanyEmptyState } from "@/components/company/CompanyEmptyState";
import { DashboardSkeleton } from "@/components/company/CompanySkeleton";
import { cwLayout } from "@/lib/companyLayout";
import { cn } from "@/lib/utils";
import { CompanyTeamMemberDiscoveryCard } from "@/components/company/CompanyTeamMemberDiscoveryCard";
import { CompanyTeamMemberContactCard } from "@/components/company/CompanyTeamMemberContactCard";
import {
  getCompanyProjectRequest,
  getCompanyRequestTeamRecommendations,
  getSavedRecommendationIds,
  saveTeamRecommendation,
  unsaveTeamRecommendation,
  parseApiErrorMessage,
  type CompanyProjectRequestDetail,
  type CompanyRequestTeamRecommendation,
} from "@/api/companyApi";
import { COMPANY_ROUTES } from "@/routes/paths";

function chemistryLabel(score: number): string {
  if (score >= 85) return "High chemistry";
  if (score >= 70) return "Strong fit";
  if (score >= 55) return "Balanced";
  return "Developing";
}

export function CompanyTeamDiscoveryProfilePage() {
  const { requestId: requestIdParam, teamId: teamIdParam } = useParams<{
    requestId: string;
    teamId: string;
  }>();
  const contactRef = useRef<HTMLDivElement>(null);

  const requestId = Number(requestIdParam);
  const teamId = Number(teamIdParam);

  const [request, setRequest] = useState<CompanyProjectRequestDetail | null>(null);
  const [team, setTeam] = useState<CompanyRequestTeamRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const backHref = useMemo(
    () =>
      Number.isFinite(requestId) && requestId > 0
        ? COMPANY_ROUTES.requestRecommendations(requestId)
        : COMPANY_ROUTES.requests,
    [requestId],
  );

  useEffect(() => {
    if (!Number.isFinite(requestId) || requestId < 1 || !Number.isFinite(teamId) || teamId < 1) {
      setError("Invalid team link.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getCompanyRequestTeamRecommendations(requestId).catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
      }),
      getCompanyProjectRequest(requestId).catch(() => null),
    ])
      .then(([teamsResult, requestDetail]) => {
        if (cancelled) return;
        if (!teamsResult) {
          setError("No team recommendations found for this request.");
          return;
        }
        const match = teamsResult.teams.find((t) => t.teamId === teamId);
        if (!match) {
          setError("This team recommendation could not be found.");
          return;
        }
        setTeam(match);
        setRequest(requestDetail);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiErrorMessage(err) || "Could not load team profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestId, teamId]);

  useEffect(() => {
    if (!Number.isFinite(requestId) || requestId < 1 || !Number.isFinite(teamId) || teamId < 1) return;
    let cancelled = false;
    getSavedRecommendationIds(requestId)
      .then((ids) => {
        if (!cancelled) setSaved(ids.teamRecommendationIds.includes(teamId));
      })
      .catch(() => {
        if (!cancelled) setSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId, teamId]);

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async () => {
    if (!Number.isFinite(requestId) || !Number.isFinite(teamId)) return;
    try {
      if (saved) {
        await unsaveTeamRecommendation(requestId, teamId);
        setSaved(false);
        toast.success("Removed from saved");
      } else {
        await saveTeamRecommendation(requestId, teamId);
        setSaved(true);
        toast.success("Team saved for later review");
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not update saved state.");
    }
  };

  if (loading) {
    return (
      <CompanyPageShell className="space-y-6">
        <DashboardSkeleton />
      </CompanyPageShell>
    );
  }

  if (error || !team) {
    return (
      <CompanyPageShell>
        <div className="cw-lux-panel">
          <div className="cw-lux-panel-body">
            <CompanyEmptyState icon={Users} message={error ?? "Team not found."} />
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline" className="rounded-lg">
                <Link to={backHref}>Back to recommendations</Link>
              </Button>
            </div>
          </div>
        </div>
      </CompanyPageShell>
    );
  }

  const chemistry = chemistryLabel(team.compatibilityScore);

  return (
    <CompanyPageShell className="space-y-6">
      <CompanyDiscoveryProfileHero
        backTo={backHref}
        backLabel="Back to recommendations"
        eyebrow="AI-recommended team"
        title={`Team #${team.teamRank}`}
        subtitle={request?.title}
        score={team.totalScore}
        visual={
          <div className="cw-discovery-team-mark shrink-0">
            <Users className="h-9 w-9" aria-hidden />
          </div>
        }
        meta={
          <p className="text-xs text-muted-foreground">
            {team.members.length} members · {chemistry}
          </p>
        }
        stats={[
          { label: "Team score", value: `${team.totalScore}%` },
          { label: "Role coverage", value: `${team.roleCoverageScore}%` },
          { label: "Chemistry", value: `${team.compatibilityScore}%` },
          { label: "Members", value: String(team.members.length) },
        ]}
        footer={
          <>
            {team.summaryReason ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{team.summaryReason}</p>
            ) : null}
            <ul className={cn("space-y-2", team.summaryReason && "mt-4")}>
              {team.members.map((member) => (
                <li key={`${member.companyRequestRoleId}-${member.studentProfileId}`} className="cw-team-member-rail-item">
                  <div className="min-w-0 text-sm">
                    <span className="font-medium">{member.roleName}</span>
                    <span className="text-muted-foreground mx-1.5">→</span>
                    <span>{member.studentName}</span>
                  </div>
                  <span className="cw-team-member-rail-score">{member.roleScore}% fit</span>
                </li>
              ))}
            </ul>
          </>
        }
        actions={
          <>
            <Button type="button" variant="outline" className="rounded-lg h-9" onClick={scrollToContact}>
              <Mail className="h-4 w-4 mr-1.5" />
              View team contact information
            </Button>
            <Button
              type="button"
              variant={saved ? "outline" : "default"}
              className={cn("rounded-lg h-9", !saved && "cw-btn-gradient border-0")}
              onClick={() => void handleSave()}
            >
              <Bookmark className={cn("h-4 w-4 mr-1.5", saved && "fill-current")} />
              {saved ? "Saved" : "Save team"}
            </Button>
          </>
        }
      />

      <CompanyLuxSection title="Team overview" icon={Users}>
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", cwLayout.gridDense)}>
          {team.members.map((member) => (
            <CompanyTeamMemberDiscoveryCard
              key={`${member.companyRequestRoleId}-${member.studentProfileId}`}
              member={member}
              requestId={requestId}
              teamId={team.teamId}
            />
          ))}
        </div>
      </CompanyLuxSection>

      <div ref={contactRef}>
        <CompanyLuxSection title="Team contact information" icon={Mail}>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", cwLayout.gridDense)}>
            {team.members.map((member) => (
              <CompanyTeamMemberContactCard
                key={`contact-${member.studentProfileId}`}
                member={member}
                requestId={requestId}
                teamId={team.teamId}
              />
            ))}
          </div>
        </CompanyLuxSection>
      </div>
    </CompanyPageShell>
  );
}
