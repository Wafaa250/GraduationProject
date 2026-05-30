import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, UserRound, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyWorkspaceLoading } from "@/components/company/CompanyWorkspaceLoading";
import { CompanyWorkspaceErrorState } from "@/components/company/CompanyWorkspaceErrorState";
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

  return (
    <CompanyPageShell>
      <CompanyPageHeader
        title={isTeamRequest ? "AI Team Recommendations" : "AI Student Recommendations"}
        subtitle={
          isTeamRequest
            ? "Complete student teams ranked for your project — review composition, chemistry, and contact members externally."
            : "Students ranked by skill fit, experience, and project alignment — open profiles to contact them directly."
        }
        actions={
          <Button asChild variant="outline" className="rounded-xl cw-btn-outline">
            <Link to={detailHref}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to request
            </Link>
          </Button>
        }
      />

      {loading && (
        <Card className="cw-card-elevated">
          <CardContent className="cw-card-body">
            <CompanyWorkspaceLoading message="Loading request context…" />
          </CardContent>
        </Card>
      )}

      {!loading && pageError && (
        <Card className="cw-card-elevated">
          <CardContent className="cw-card-body">
            <CompanyWorkspaceErrorState
              message={pageError}
              retryLabel="Back to request"
              onRetry={() => navigate(detailHref)}
            />
          </CardContent>
        </Card>
      )}

      {!loading && !pageError && error && isIndividualRequest && (
        <Card className="cw-card-elevated">
          <CardContent className="cw-card-body">
            <CompanyWorkspaceErrorState
              message={error}
              retryLabel="Back to request"
              onRetry={() => navigate(detailHref)}
            />
          </CardContent>
        </Card>
      )}

      {!loading && !pageError && request && !(error && isIndividualRequest) && (
        <div className="flex flex-col cw-grid-gap">
          {isPaused && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                className="rounded-xl shrink-0"
                disabled={reactivating}
                onClick={() => void handleReactivate()}
              >
                {reactivating ? "Reactivating…" : "Reactivate Request"}
              </Button>
            </div>
          )}

          {isClosed && (
            <div className="rounded-xl border border-muted-foreground/20 bg-muted/40 px-4 py-3">
              <p className="text-sm font-medium">This request has been closed.</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Recommendations remain visible for reference. Saving new candidates or teams is
                disabled.
              </p>
            </div>
          )}

          <CompanyRequestRecommendationSummary
            request={request}
            variant={isTeamRequest ? "team" : "individual"}
          />

          {isIndividualRequest && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" />
                <span>
                  <span className="font-medium text-foreground">{candidates.length}</span>{" "}
                  AI-ranked {candidates.length === 1 ? "student" : "students"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                Contact students outside SkillSwap after reviewing profiles
              </p>
            </div>
          )}

          {isTeamRequest && !loadingRecommendations && teamRecommendations.length > 0 && !isViewOnly && (
            <CompanyTeamRecommendationsToolbar
              teamCount={teamRecommendations.length}
              regenerating={regeneratingTeams}
              onRegenerate={() => void regenerateTeams()}
            />
          )}

          {isIndividualRequest && candidates.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 cw-grid-gap-compact">
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
            <div className="grid md:grid-cols-2 xl:grid-cols-3 cw-grid-gap-compact">
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
            <Card className="cw-card-elevated cw-team-state-panel">
              <CardContent className="cw-card-body">
                <div className="cw-request-success-icon mb-5 mx-auto">
                  <UserRound className="h-8 w-8" aria-hidden />
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-center">No recommendations yet</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed text-center">
                  {loadingRecommendations
                    ? "SkillSwap AI is analyzing your request against student profiles."
                    : "We could not surface matches right now. Refine roles or skills on your request and try again."}
                </p>
                <div className="flex justify-center mt-6">
                  <Button asChild variant="outline" className="rounded-xl cw-btn-outline">
                    <Link to={detailHref}>Edit request</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
