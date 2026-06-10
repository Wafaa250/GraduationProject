import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, UserRound, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CompanyLuxHero, CompanyLuxStat } from "@/components/company/CompanyPremiumUI";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanySkeleton } from "@/components/company/CompanySkeleton";
import { CompanyEmptyState } from "@/components/company/CompanyEmptyState";
import { cwLayout } from "@/lib/companyLayout";
import {
  COMPANY_RECOMMENDATIONS_STUDENTS_DESC,
  COMPANY_RECOMMENDATIONS_TEAMS_DESC,
} from "@/lib/companyWorkspaceCopy";
import { CompanyRequestRecommendationSummary } from "@/components/company/CompanyRequestRecommendationSummary";
import { CompanyCandidateCard } from "@/components/company/CompanyCandidateCard";
import { CompanyTeamRecommendationCard } from "@/components/company/CompanyTeamRecommendationCard";
import { CompanyTeamRecommendationsLoadingPanel } from "@/components/company/CompanyTeamRecommendationCardSkeleton";
import { CompanyTeamRecommendationsEmptyState } from "@/components/company/CompanyTeamRecommendationsEmptyState";
import { CompanyTeamRecommendationsErrorState } from "@/components/company/CompanyTeamRecommendationsErrorState";
import { CompanyTeamRecommendationsToolbar } from "@/components/company/CompanyTeamRecommendationsToolbar";
import {
  generateCompanyRequestRecommendations,
  generateCompanyRequestTeamRecommendations,
  getCompanyRequestRecommendations,
  getCompanyRequestTeamRecommendations,
  regenerateCompanyRequestTeamRecommendations,
  getCompanyProjectRequest,
  getSavedRecommendationIds,
  saveStudentRecommendation,
  unsaveStudentRecommendation,
  saveTeamRecommendation,
  unsaveTeamRecommendation,
  updateCompanyProjectRequestStatus,
  parseApiErrorMessage,
  type CompanyRequestRecommendationItem,
  type CompanyRequestTeamRecommendation,
  type CompanyProjectRequestDetail,
} from "@/api/companyApi";
import type { RecommendationCandidate } from "@/types/companyRecommendation";
import { mapStudentDiscoveryContact } from "@/lib/studentDiscoveryContact";
import { getRequestLifecycleStatus, isRequestViewOnly } from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/routes/paths";
import { cn } from "@/lib/utils";

export function CompanyRequestRecommendationsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = Number(id);

  const [request, setRequest] = useState<CompanyProjectRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamOrchestrationFailed, setTeamOrchestrationFailed] = useState(false);

  const [regeneratingTeams, setRegeneratingTeams] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [savedStudentIds, setSavedStudentIds] = useState<Set<number>>(() => new Set());
  const [savedTeamIds, setSavedTeamIds] = useState<Set<number>>(() => new Set());
  const [candidates, setCandidates] = useState<RecommendationCandidate[]>([]);
  const [teamRecommendations, setTeamRecommendations] = useState<CompanyRequestTeamRecommendation[]>([]);
  const [reactivating, setReactivating] = useState(false);

  const lifecycleStatus = request ? getRequestLifecycleStatus(request) : "active";
  const isPaused = lifecycleStatus === "paused";
  const isClosed = lifecycleStatus === "closed";
  const isViewOnly = isRequestViewOnly(lifecycleStatus);

  useEffect(() => {
    if (!Number.isFinite(numId) || numId < 1) {
      setPageError("This request could not be found.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPageError(null);
    getCompanyProjectRequest(numId)
      .then((data) => {
        if (!cancelled) setRequest(data);
      })
      .catch((err) => {
        if (!cancelled) setPageError(parseApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [numId]);

  const isTeamRequest = request?.requestType === "ai-built-team";
  const isIndividualRequest = !isTeamRequest;

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    setLoadingRecommendations(true);
    if (isTeamRequest) {
      setTeamOrchestrationFailed(false);
    }

    const loadIndividual = async () => {
      try {
        const existing = await getCompanyRequestRecommendations(request.id);
        if (!cancelled) setCandidates(existing.items.map(mapRecommendationToCandidate));
        return;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404) throw err;
      }

      if (isViewOnly) {
        if (!cancelled) setCandidates([]);
        return;
      }

      const generated = await generateCompanyRequestRecommendations(request.id);
      if (!cancelled) setCandidates(generated.items.map(mapRecommendationToCandidate));
    };

    const loadTeams = async () => {
      try {
        const existing = await getCompanyRequestTeamRecommendations(request.id);
        if (!cancelled) {
          setTeamRecommendations(existing.teams);
          setTeamOrchestrationFailed(false);
        }
        return;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          if (isViewOnly) {
            if (!cancelled) setTeamRecommendations([]);
            return;
          }
          const generated = await generateCompanyRequestTeamRecommendations(request.id);
          if (!cancelled) {
            setTeamRecommendations(generated.teams);
            setTeamOrchestrationFailed(false);
          }
          return;
        }
        throw err;
      }
    };

    const load = isTeamRequest ? loadTeams : loadIndividual;
    load()
      .catch((err) => {
        if (cancelled) return;
        if (isTeamRequest) {
          setTeamOrchestrationFailed(true);
          setTeamRecommendations([]);
        } else {
          setError(parseApiErrorMessage(err) || "Failed to load recommendations.");
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingRecommendations(false);
      });

    return () => {
      cancelled = true;
    };
  }, [request, isTeamRequest, isViewOnly]);

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    getSavedRecommendationIds(request.id)
      .then((ids) => {
        if (cancelled) return;
        setSavedStudentIds(new Set(ids.studentProfileIds));
        setSavedTeamIds(new Set(ids.teamRecommendationIds));
      })
      .catch(() => {
        if (!cancelled) {
          setSavedStudentIds(new Set());
          setSavedTeamIds(new Set());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  const detailHref =
    Number.isFinite(numId) && numId > 0
      ? COMPANY_ROUTES.requestDetail(numId)
      : COMPANY_ROUTES.requests;

  const regenerateTeams = async () => {
    if (!request || isViewOnly) return;
    setRegeneratingTeams(true);
    setTeamOrchestrationFailed(false);
    setLoadingRecommendations(true);
    try {
      const result = await regenerateCompanyRequestTeamRecommendations(request.id, {
        forceRegenerate: true,
      });
      setTeamRecommendations(result.teams);
      if (result.teams.length === 0) {
        toast("No new team compositions were produced. Try adjusting role requirements.");
      } else {
        toast.success("New team compositions generated.");
      }
    } catch {
      setTeamOrchestrationFailed(true);
      setTeamRecommendations([]);
      toast.error("Team orchestration is temporarily unavailable. Please try again.");
    } finally {
      setRegeneratingTeams(false);
      setLoadingRecommendations(false);
    }
  };

  const toggleSaveStudent = async (studentProfileId: number) => {
    if (!request || isViewOnly) return;
    const isSaved = savedStudentIds.has(studentProfileId);
    try {
      if (isSaved) {
        await unsaveStudentRecommendation(request.id, studentProfileId);
        setSavedStudentIds((prev) => {
          const next = new Set(prev);
          next.delete(studentProfileId);
          return next;
        });
        toast.success("Removed from saved");
      } else {
        await saveStudentRecommendation(request.id, studentProfileId);
        setSavedStudentIds((prev) => new Set(prev).add(studentProfileId));
        toast.success("Saved for later review");
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not update saved state.");
    }
  };

  const toggleSaveTeam = async (teamRecommendationId: number) => {
    if (!request || isViewOnly) return;
    const isSaved = savedTeamIds.has(teamRecommendationId);
    try {
      if (isSaved) {
        await unsaveTeamRecommendation(request.id, teamRecommendationId);
        setSavedTeamIds((prev) => {
          const next = new Set(prev);
          next.delete(teamRecommendationId);
          return next;
        });
        toast.success("Removed from saved");
      } else {
        await saveTeamRecommendation(request.id, teamRecommendationId);
        setSavedTeamIds((prev) => new Set(prev).add(teamRecommendationId));
        toast.success("Saved for later review");
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not update saved state.");
    }
  };

  const handleReactivate = async () => {
    if (!request) return;
    setReactivating(true);
    try {
      const updated = await updateCompanyProjectRequestStatus(request.id, "Active");
      setRequest(updated);
      toast.success("Request reactivated");
    } catch (err) {
      toast.error(parseApiErrorMessage(err));
    } finally {
      setReactivating(false);
    }
  };

  const matchCount = isTeamRequest ? teamRecommendations.length : candidates.length;
  const savedCount = isTeamRequest ? savedTeamIds.size : savedStudentIds.size;

  const heroTitle = isTeamRequest ? "AI Team Recommendations" : "AI Student Recommendations";
  const heroDesc = isTeamRequest
    ? COMPANY_RECOMMENDATIONS_TEAMS_DESC
    : COMPANY_RECOMMENDATIONS_STUDENTS_DESC;

  return (
    <CompanyPageShell className="space-y-6">
      <CompanyLuxHero
        eyebrow="AI recommendations"
        title={heroTitle}
        description={heroDesc}
        aside={
          request && !loadingRecommendations && matchCount > 0 ? (
            <div className="grid grid-cols-2 gap-2 w-full cw-lux-hero-aside-stats">
              <CompanyLuxStat
                label={isTeamRequest ? "Teams" : "Students"}
                value={matchCount}
                icon={isTeamRequest ? Users : UserRound}
                accent="ai"
              />
              <CompanyLuxStat label="Saved" value={savedCount} icon={Sparkles} />
            </div>
          ) : undefined
        }
        actions={
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          >
            <Link to={detailHref}>
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Back to request</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>
        }
      />

      {loading && (
        <>
          <CompanySkeleton className="h-40 w-full rounded-xl" />
          <div className={cwLayout.cardGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CompanySkeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        </>
      )}

      {!loading && pageError && (
        <div className="cw-lux-panel">
          <div className="cw-lux-panel-body">
            <CompanyEmptyState icon={Sparkles} message={pageError} />
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline" className="rounded-lg">
                <Link to={detailHref}>Back to request</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && !pageError && error && isIndividualRequest && (
        <div className="cw-lux-panel">
          <div className="cw-lux-panel-body">
            <CompanyEmptyState icon={UserRound} message={error} />
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline" className="rounded-lg">
                <Link to={detailHref}>Back to request</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && !pageError && request && !(error && isIndividualRequest) && (
        <>
          {isPaused && (
            <div className="cw-status-banner cw-status-banner--paused">
              <div>
                <p className="text-sm font-medium">Request Paused</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  This request is view-only. Reactivate it to run AI matching, save candidates, or
                  edit the request.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-lg shrink-0 cw-btn-gradient border-0"
                disabled={reactivating}
                onClick={() => void handleReactivate()}
              >
                {reactivating ? "Reactivating…" : "Reactivate Request"}
              </Button>
            </div>
          )}

          {isClosed && (
            <div className="cw-status-banner cw-status-banner--closed">
              <div>
                <p className="text-sm font-medium">This request has been closed.</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Recommendations remain visible for reference. Saving new candidates or teams is
                  disabled.
                </p>
              </div>
            </div>
          )}

          <CompanyRequestRecommendationSummary
            request={request}
            variant={isTeamRequest ? "team" : "individual"}
          />

          {isTeamRequest && !loadingRecommendations && teamRecommendations.length > 0 && !isViewOnly && (
            <CompanyTeamRecommendationsToolbar
              teamCount={teamRecommendations.length}
              regenerating={regeneratingTeams}
              onRegenerate={() => void regenerateTeams()}
            />
          )}

          {isIndividualRequest && candidates.length > 0 ? (
            <div className={cn(cwLayout.cardGrid, "cw-animate-stagger")}>
              {candidates.map((candidate) => (
                <CompanyCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  saved={savedStudentIds.has(candidate.studentProfileId)}
                  saveDisabled={isViewOnly}
                  onViewProfile={() =>
                    navigate(
                      COMPANY_ROUTES.studentDiscoveryProfile(numId, candidate.studentProfileId),
                    )
                  }
                  onToggleSave={() => void toggleSaveStudent(candidate.studentProfileId)}
                />
              ))}
            </div>
          ) : isTeamRequest && loadingRecommendations ? (
            <CompanyTeamRecommendationsLoadingPanel
              phase={regeneratingTeams ? "regenerating" : "initial"}
            />
          ) : isTeamRequest && teamOrchestrationFailed ? (
            <CompanyTeamRecommendationsErrorState
              detailHref={detailHref}
              regenerating={regeneratingTeams}
              onRegenerate={() => void regenerateTeams()}
            />
          ) : isTeamRequest && teamRecommendations.length > 0 ? (
            <div className={cn(cwLayout.cardGrid, "cw-animate-stagger")}>
              {teamRecommendations.map((team) => (
                <CompanyTeamRecommendationCard
                  key={team.teamId}
                  requestId={numId}
                  team={team}
                  saved={savedTeamIds.has(team.teamId)}
                  saveDisabled={isViewOnly}
                  onToggleSave={() => void toggleSaveTeam(team.teamId)}
                />
              ))}
            </div>
          ) : isTeamRequest ? (
            <CompanyTeamRecommendationsEmptyState
              request={request}
              detailHref={detailHref}
              regenerating={regeneratingTeams}
              onRegenerate={() => void regenerateTeams()}
            />
          ) : (
            <div className="cw-lux-panel cw-team-state-panel">
              <div className="cw-lux-panel-body py-14 text-center">
                <div className="cw-empty-state-icon mx-auto mb-4">
                  <UserRound className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">No recommendations yet</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                  {loadingRecommendations
                    ? "SkillSwap AI is analyzing your request against student profiles."
                    : "We could not surface matches right now. Refine roles or skills on your request and try again."}
                </p>
                <Button asChild variant="outline" className="rounded-lg mt-8">
                  <Link to={detailHref}>Edit request</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}

    </CompanyPageShell>
  );
}

function mapRecommendationToCandidate(item: CompanyRequestRecommendationItem): RecommendationCandidate {
  const skills = item.student.skills ?? [];
  const insightLines = item.highlights.length > 0 ? item.highlights : [item.reasonSummary];
  const matchingSkills = skills.slice(0, 4);

  return {
    id: `rec-${item.id}`,
    studentProfileId: item.student.studentProfileId,
    name: item.student.name,
    university: item.student.university ?? "University not specified",
    year: item.student.academicYear ?? "Academic year not specified",
    major: item.student.major ?? item.student.faculty ?? "Discipline not specified",
    matchScore: item.score,
    matchingSkills: matchingSkills.length > 0 ? matchingSkills : skills.slice(0, 4),
    insights: insightLines.slice(0, 4),
    bio:
      item.student.bio ??
      "No bio details available yet. Open profile details for more information when provided.",
    skills: skills.slice(0, 12),
    tools: [],
    projectInterests: [],
    contact: mapStudentDiscoveryContact(item.student),
  };
}
