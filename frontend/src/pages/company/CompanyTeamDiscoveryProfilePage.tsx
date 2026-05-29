import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Users, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompanyMatchScoreBadge } from "@/components/company/CompanyMatchScoreBadge";
import { CompanyRequestReviewStat } from "@/components/company/CompanyRequestReviewStat";
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
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <p className="text-sm text-muted-foreground text-center py-24">Loading team profile…</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto text-center">
        <p className="text-sm text-muted-foreground">{error ?? "Team not found."}</p>
        <Button asChild variant="outline" className="rounded-xl mt-6">
          <Link to={backHref}>Back to recommendations</Link>
        </Button>
      </div>
    );
  }

  const chemistry = chemistryLabel(team.compatibilityScore);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-3 rounded-xl">
        <Link to={backHref}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to recommendations
        </Link>
      </Button>

      {/* Team header */}
      <Card className="cw-card-elevated overflow-hidden border-primary/20">
        <div className="h-24 cw-hero-bg relative opacity-95">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-violet-500/10" />
        </div>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col lg:flex-row lg:items-end gap-5 -mt-10">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground grid place-items-center ring-4 ring-card shadow-lg shrink-0">
              <Users className="h-9 w-9" aria-hidden />
            </div>
            <div className="flex-1 min-w-0 lg:pb-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                AI-recommended team
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-0.5">
                Team #{team.teamRank}
              </h1>
              {request && (
                <p className="text-sm text-muted-foreground mt-1 truncate">{request.title}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {team.members.length} members · {chemistry}
              </p>
            </div>
            <div className="shrink-0 lg:pb-1">
              <CompanyMatchScoreBadge score={team.totalScore} size="lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <CompanyRequestReviewStat label="Team score" value={`${team.totalScore}%`} />
            <CompanyRequestReviewStat label="Role coverage" value={`${team.roleCoverageScore}%`} />
            <CompanyRequestReviewStat label="Chemistry" value={`${team.compatibilityScore}%`} />
            <CompanyRequestReviewStat label="Members" value={String(team.members.length)} />
          </div>

          {team.summaryReason && (
            <p className="text-sm text-muted-foreground mt-5 leading-relaxed border-t border-border/60 pt-5">
              {team.summaryReason}
            </p>
          )}

          <ul className="mt-5 space-y-2 border-t border-border/60 pt-5">
            {team.members.map((member) => (
              <li
                key={`${member.companyRequestRoleId}-${member.studentProfileId}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground">{member.roleName}</span>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span className="text-sm text-foreground">{member.studentName}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  {member.roleScore}% fit
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2 mt-5">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={scrollToContact}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              View team contact information
            </Button>
            <Button
              type="button"
              variant={saved ? "outline" : "default"}
              className={cn(
                "rounded-xl",
                !saved && "cw-btn-gradient border-0 shadow-sm",
                saved && "text-primary border-primary/30",
              )}
              onClick={() => void handleSave()}
            >
              <Bookmark className={cn("h-4 w-4 mr-1.5", saved && "fill-current")} />
              {saved ? "Saved" : "Save team"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team overview */}
      <section>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Team overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.members.map((member) => (
            <CompanyTeamMemberDiscoveryCard
              key={`${member.companyRequestRoleId}-${member.studentProfileId}`}
              member={member}
              requestId={requestId}
              teamId={team.teamId}
            />
          ))}
        </div>
      </section>

      {/* Team contact — horizontal grid */}
      <section ref={contactRef}>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          Team contact information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.members.map((member) => (
            <CompanyTeamMemberContactCard
              key={`contact-${member.studentProfileId}`}
              member={member}
              requestId={requestId}
              teamId={team.teamId}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
