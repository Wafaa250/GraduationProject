import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, UserRound, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyRequestRecommendationSummary } from "@/components/company/CompanyRequestRecommendationSummary";
import { CompanyCandidateCard } from "@/components/company/CompanyCandidateCard";
import { CompanyCandidateProfilePanel } from "@/components/company/CompanyCandidateProfilePanel";
import { CompanyCandidateInviteDialog } from "@/components/company/CompanyCandidateInviteDialog";
import { CompanyTeamRecommendationCard } from "@/components/company/CompanyTeamRecommendationCard";
import { CompanyTeamDetailPanel } from "@/components/company/CompanyTeamDetailPanel";
import { CompanyTeamRecommendationsLoadingPanel } from "@/components/company/CompanyTeamRecommendationCardSkeleton";
import { CompanyTeamRecommendationsEmptyState } from "@/components/company/CompanyTeamRecommendationsEmptyState";
import { CompanyTeamRecommendationsErrorState } from "@/components/company/CompanyTeamRecommendationsErrorState";
import { CompanyTeamRecommendationsToolbar } from "@/components/company/CompanyTeamRecommendationsToolbar";
import {
  createCompanyRequestInvitation,
  generateCompanyRequestRecommendations,
  generateCompanyRequestTeamRecommendations,
  getCompanyRequestRecommendations,
  getCompanyRequestTeamRecommendations,
  regenerateCompanyRequestTeamRecommendations,
  getCompanyProjectRequest,
  listCompanyRequestInvitations,
  parseApiErrorMessage,
  type CompanyRequestInvitation,
  type CompanyRequestRecommendationItem,
  type CompanyRequestTeamRecommendation,
  type CompanyRequestTeamRecommendationMember,
  type CompanyProjectRequestDetail,
} from "@/api/companyApi";
import type { RecommendationCandidate } from "@/types/companyRecommendation";
import { COMPANY_ROUTES } from "@/routes/paths";

export function CompanyRequestRecommendationsPage() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);

  const [request, setRequest] = useState<CompanyProjectRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamOrchestrationFailed, setTeamOrchestrationFailed] = useState(false);

  const [profileCandidate, setProfileCandidate] = useState<RecommendationCandidate | null>(null);
  const [profileTeamMember, setProfileTeamMember] =
    useState<CompanyRequestTeamRecommendationMember | null>(null);
  const [inviteCandidate, setInviteCandidate] = useState<RecommendationCandidate | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [invitingMemberId, setInvitingMemberId] = useState<number | null>(null);
  const [invitingTeamId, setInvitingTeamId] = useState<number | null>(null);
  const [regeneratingTeams, setRegeneratingTeams] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [candidates, setCandidates] = useState<RecommendationCandidate[]>([]);
  const [teamRecommendations, setTeamRecommendations] = useState<CompanyRequestTeamRecommendation[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<CompanyRequestTeamRecommendation | null>(null);
  const [invitedStudentIds, setInvitedStudentIds] = useState<Set<number>>(() => new Set());
  const [invitationStatusByStudentId, setInvitationStatusByStudentId] = useState<
    Map<number, CompanyRequestInvitation["status"]>
  >(new Map());

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
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404) throw err;
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
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
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
    load().catch((err) => {
      if (cancelled) return;
      if (isTeamRequest) {
        setTeamOrchestrationFailed(true);
        setTeamRecommendations([]);
      } else {
        setError(parseApiErrorMessage(err) || "Failed to load recommendations.");
      }
    }).finally(() => {
      if (cancelled) return;
      setLoadingRecommendations(false);
    });

    return () => {
      cancelled = true;
    };
  }, [request, isTeamRequest]);

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    listCompanyRequestInvitations(request.id)
      .then((rows) => {
        if (cancelled) return;
        const statusMap = new Map<number, CompanyRequestInvitation["status"]>();
        rows.forEach((row) => {
          if (!statusMap.has(row.studentProfileId)) {
            statusMap.set(row.studentProfileId, row.status);
          }
        });
        setInvitationStatusByStudentId(statusMap);

        const activeStatuses = new Set<CompanyRequestInvitation["status"]>(["pending", "accepted"]);
        const invited = rows
          .filter((row) => activeStatuses.has(row.status))
          .map((row) => row.studentProfileId);
        setInvitedStudentIds(new Set(invited));
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(parseApiErrorMessage(err) || "Failed to load invitation statuses.");
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  const detailHref =
    Number.isFinite(numId) && numId > 0
      ? COMPANY_ROUTES.requestDetail(numId)
      : COMPANY_ROUTES.requests;

  const openInvite = (candidate: RecommendationCandidate) => {
    if (invitedStudentIds.has(candidate.studentProfileId)) return;
    setInviteCandidate(candidate);
    setInviteOpen(true);
  };

  const resolveRoleIdForInvitation = (): number | undefined => {
    if (!request) return undefined;
    return request.roles.length === 1 ? request.roles[0].id : undefined;
  };

  const handleInviteSent = async (message: string) => {
    if (!inviteCandidate) return;
    if (!inviteCandidate.studentProfileId) {
      toast.error("This candidate is not mapped to a real student profile yet.");
      return;
    }

    setSendingInvite(true);
    try {
      await createCompanyRequestInvitation(numId, {
        studentProfileId: inviteCandidate.studentProfileId,
        message: message || undefined,
        companyRequestRoleId: resolveRoleIdForInvitation(),
        matchScore: inviteCandidate.matchScore,
        source: "recommendation",
      });
      setInvitedStudentIds((prev) => new Set(prev).add(inviteCandidate.studentProfileId));
      toast.success(`Invitation sent to ${inviteCandidate.name.split(" ")[0]}`);
      setInviteOpen(false);
    } catch (err) {
      const msg = parseApiErrorMessage(err);
      const normalized = msg.toLowerCase();
      if (normalized.includes("already exists") || normalized.includes("already been invited")) {
        setInvitedStudentIds((prev) => new Set(prev).add(inviteCandidate.studentProfileId));
        toast.error("This student has already been invited.");
        setInviteOpen(false);
        return;
      }
      toast.error(msg || "Could not send invitation right now.");
    } finally {
      setSendingInvite(false);
    }
  };

  const inviteTeamMember = async (
    member: CompanyRequestTeamRecommendationMember,
    message?: string,
  ) => {
    setInvitingMemberId(member.studentProfileId);
    try {
      await createCompanyRequestInvitation(numId, {
        studentProfileId: member.studentProfileId,
        companyRequestRoleId: member.companyRequestRoleId,
        message: message || `SkillSwap AI team recommendation for ${member.roleName}.`,
        matchScore: member.roleScore,
        source: "team-recommendation",
      });
      setInvitedStudentIds((prev) => new Set(prev).add(member.studentProfileId));
      setInvitationStatusByStudentId((prev) => {
        const next = new Map(prev);
        next.set(member.studentProfileId, "pending");
        return next;
      });
      toast.success(`Invitation sent to ${member.studentName.split(" ")[0]}`);
    } catch (err) {
      const msg = parseApiErrorMessage(err);
      const normalized = msg.toLowerCase();
      if (normalized.includes("already exists") || normalized.includes("already been invited")) {
        setInvitedStudentIds((prev) => new Set(prev).add(member.studentProfileId));
        toast.error("This student has already been invited.");
      } else {
        toast.error(msg || "Could not send invitation right now.");
      }
    } finally {
      setInvitingMemberId(null);
    }
  };

  const inviteFullTeam = async (team: CompanyRequestTeamRecommendation) => {
    const targets = team.members.filter((m) => {
      const status = invitationStatusByStudentId.get(m.studentProfileId);
      return status !== "pending" && status !== "accepted";
    });
    if (targets.length === 0) {
      toast.success("All team members are already invited.");
      return;
    }

    setInvitingTeamId(team.teamId);
    try {
      for (const member of targets) {
        await createCompanyRequestInvitation(numId, {
          studentProfileId: member.studentProfileId,
          companyRequestRoleId: member.companyRequestRoleId,
          message: `SkillSwap AI full team composition invite for ${member.roleName}.`,
          matchScore: member.roleScore,
          source: "team-recommendation",
        });
      }
      const sentIds = targets.map((m) => m.studentProfileId);
      setInvitedStudentIds((prev) => {
        const next = new Set(prev);
        sentIds.forEach((id) => next.add(id));
        return next;
      });
      setInvitationStatusByStudentId((prev) => {
        const next = new Map(prev);
        sentIds.forEach((id) => next.set(id, "pending"));
        return next;
      });
      toast.success(`Invitations sent to ${targets.length} team member${targets.length > 1 ? "s" : ""}.`);
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not invite full team.");
    } finally {
      setInvitingTeamId(null);
    }
  };

  const regenerateTeams = async () => {
    if (!request) return;
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

  const toggleSave = (candidateId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
        toast.success("Removed from saved candidates");
      } else {
        next.add(candidateId);
        toast.success("Candidate saved for later");
      }
      return next;
    });
  };

  const invitedIds = useMemo(
    () =>
      new Set(
        candidates
          .filter((candidate) => invitedStudentIds.has(candidate.studentProfileId))
          .map((candidate) => candidate.id),
      ),
    [candidates, invitedStudentIds],
  );

  const profileInvitationSent = profileCandidate
    ? invitedStudentIds.has(profileCandidate.studentProfileId)
    : false;

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <CompanyPageHeader
        title={isTeamRequest ? "AI Team Recommendations" : "AI Candidate Recommendations"}
        subtitle={
          isTeamRequest
            ? "Complete student teams ranked for your project."
            : "Suggested students aligned with your request's role, skills, and collaboration preferences."
        }
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to={detailHref}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to request
            </Link>
          </Button>
        }
      />

      {loading && (
        <Card className="cw-card-elevated">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Loading request context…
          </CardContent>
        </Card>
      )}

      {!loading && pageError && (
        <Card className="cw-card-elevated">
          <CardContent className="py-16 text-center px-6">
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {pageError}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Return to the request and try again, or contact support if the issue continues.
            </p>
            <Button asChild variant="outline" className="rounded-xl mt-6">
              <Link to={detailHref}>Back to request</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !pageError && error && isIndividualRequest && (
        <Card className="cw-card-elevated">
          <CardContent className="py-16 text-center px-6">
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {error}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Return to the request and try again, or contact support if the issue continues.
            </p>
            <Button asChild variant="outline" className="rounded-xl mt-6">
              <Link to={detailHref}>Back to request</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !pageError && request && !(error && isIndividualRequest) && (
        <>
          <CompanyRequestRecommendationSummary
            request={request}
            variant={isTeamRequest ? "team" : "individual"}
          />

          {isIndividualRequest && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-medium text-foreground">{candidates.length}</span>{" "}
                {candidates.length === 1 ? "suggested match" : "suggested matches"}
              </span>
            </p>
            {invitedIds.size > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                {invitedIds.size} invitation{invitedIds.size === 1 ? "" : "s"} sent
              </p>
            )}
          </div>
          )}

          {isTeamRequest && !loadingRecommendations && teamRecommendations.length > 0 && (
            <CompanyTeamRecommendationsToolbar
              teamCount={teamRecommendations.length}
              regenerating={regeneratingTeams}
              onRegenerate={() => void regenerateTeams()}
            />
          )}

          {isIndividualRequest && candidates.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {candidates.map((candidate) => (
                <CompanyCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  saved={savedIds.has(candidate.id)}
                  invitationSent={invitedIds.has(candidate.id)}
                  onViewProfile={() => {
                    setProfileTeamMember(null);
                    setProfileCandidate(candidate);
                  }}
                  onInvite={() => openInvite(candidate)}
                  onToggleSave={() => toggleSave(candidate.id)}
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
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teamRecommendations.map((team) => (
                <CompanyTeamRecommendationCard
                  key={team.teamId}
                  team={team}
                  invitingTeamId={invitingTeamId}
                  invitationStatusByStudentId={invitationStatusByStudentId}
                  onViewTeam={setSelectedTeam}
                  onInviteTeam={inviteFullTeam}
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
              <CardContent className="py-16 md:py-20 px-6 text-center">
                <div className="cw-request-success-icon mb-5 mx-auto">
                  <UserRound className="h-8 w-8" aria-hidden />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">No suggested matches yet</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                  {loadingRecommendations
                    ? "SkillSwap is evaluating role fit and collaboration signals for this request."
                    : "We could not surface candidates for this request right now. Try updating the role or skills on your request, then check back for new suggestions."}
                </p>
                <Button asChild variant="outline" className="rounded-xl mt-8">
                  <Link to={detailHref}>Edit request</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <CompanyTeamDetailPanel
        team={selectedTeam}
        invitingTeamId={invitingTeamId}
        invitingMemberId={invitingMemberId}
        invitationStatusByStudentId={invitationStatusByStudentId}
        onClose={() => setSelectedTeam(null)}
        onInviteTeam={inviteFullTeam}
        onInviteMember={(member) => void inviteTeamMember(member)}
        onViewMember={(member) => {
          if (!selectedTeam) return;
          setProfileTeamMember(member);
          setProfileCandidate(mapTeamMemberToCandidate(member, selectedTeam.teamId));
        }}
      />

      <CompanyCandidateProfilePanel
        candidate={profileCandidate}
        invitationSent={profileInvitationSent}
        onClose={() => {
          setProfileCandidate(null);
          setProfileTeamMember(null);
        }}
        onInvite={() => {
          if (profileTeamMember) {
            void inviteTeamMember(profileTeamMember);
            return;
          }
          if (profileCandidate) openInvite(profileCandidate);
        }}
      />

      <CompanyCandidateInviteDialog
        candidate={inviteCandidate}
        open={inviteOpen}
        sending={sendingInvite}
        onClose={() => setInviteOpen(false)}
        onSend={handleInviteSent}
      />
    </div>
  );
}

function mapRecommendationToCandidate(item: CompanyRequestRecommendationItem): RecommendationCandidate {
  const skills = item.student.skills ?? [];
  const insightLines = item.highlights.length > 0 ? item.highlights : [item.reasonSummary];
  const matchingSkills = skills.slice(0, 4);
  const availability = resolveAvailabilityFromBreakdown(item);

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
    availability,
    bio:
      item.student.bio ??
      "No bio details available yet. Open profile details for more information when provided.",
    skills: skills.slice(0, 12),
    tools: [],
    projectInterests: [],
  };
}

function resolveAvailabilityFromBreakdown(
  item: CompanyRequestRecommendationItem,
): RecommendationCandidate["availability"] {
  const fit = item.scoreBreakdown.collaborationFit;
  if (fit >= 75) return "Available";
  if (fit >= 45) return "Limited";
  return "Busy";
}

function mapTeamMemberToCandidate(
  member: CompanyRequestTeamRecommendationMember,
  teamId: number,
): RecommendationCandidate {
  return {
    id: `team-${teamId}-member-${member.companyRequestRoleId}-${member.studentProfileId}`,
    studentProfileId: member.studentProfileId,
    name: member.studentName,
    university: member.university ?? "University not specified",
    year: "Academic year not specified",
    major: member.major ?? member.faculty ?? "Discipline not specified",
    matchScore: member.roleScore,
    matchingSkills: member.highlights.slice(0, 3),
    insights: member.highlights.length > 0 ? member.highlights.slice(0, 4) : [member.assignmentReason],
    availability: "Limited",
    bio: member.assignmentReason,
    skills: member.highlights,
    tools: [],
    projectInterests: [],
  };
}
