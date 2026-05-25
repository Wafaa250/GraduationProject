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
import {
  getCompanyProjectRequest,
  parseApiErrorMessage,
  type CompanyProjectRequestDetail,
} from "@/api/companyApi";
import { buildPlaceholderRecommendations } from "@/data/companyRecommendationPlaceholders";
import { getRequestSkillLabels } from "@/lib/companyRequestDisplay";
import type { RecommendationCandidate } from "@/types/companyRecommendation";
import { COMPANY_ROUTES } from "@/routes/paths";

export function CompanyRequestRecommendationsPage() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);

  const [request, setRequest] = useState<CompanyProjectRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileCandidate, setProfileCandidate] = useState<RecommendationCandidate | null>(null);
  const [inviteCandidate, setInviteCandidate] = useState<RecommendationCandidate | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [invitedIds, setInvitedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!Number.isFinite(numId) || numId < 1) {
      setError("This request could not be found.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCompanyProjectRequest(numId)
      .then((data) => {
        if (!cancelled) setRequest(data);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [numId]);

  const candidates = useMemo(() => {
    if (!request) return [];
    return buildPlaceholderRecommendations(getRequestSkillLabels(request));
  }, [request]);

  const detailHref =
    Number.isFinite(numId) && numId > 0
      ? COMPANY_ROUTES.requestDetail(numId)
      : COMPANY_ROUTES.requests;

  const openInvite = (candidate: RecommendationCandidate) => {
    if (invitedIds.has(candidate.id)) return;
    setInviteCandidate(candidate);
    setInviteOpen(true);
  };

  const handleInviteSent = () => {
    if (!inviteCandidate) return;
    const { id: candidateId, name } = inviteCandidate;
    setInvitedIds((prev) => new Set(prev).add(candidateId));
    const firstName = name.split(" ")[0];
    toast.success(`Invitation sent to ${firstName}`);
    setInviteOpen(false);
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

  const profileInvitationSent = profileCandidate
    ? invitedIds.has(profileCandidate.id)
    : false;

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <CompanyPageHeader
        title="AI Candidate Recommendations"
        subtitle="Suggested students aligned with your request's role, skills, and collaboration preferences."
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
            Loading suggested candidates…
          </CardContent>
        </Card>
      )}

      {!loading && error && (
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

      {!loading && request && (
        <>
          <CompanyRequestRecommendationSummary request={request} />

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

          {candidates.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {candidates.map((candidate) => (
                <CompanyCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  saved={savedIds.has(candidate.id)}
                  invitationSent={invitedIds.has(candidate.id)}
                  onViewProfile={() => setProfileCandidate(candidate)}
                  onInvite={() => openInvite(candidate)}
                  onToggleSave={() => toggleSave(candidate.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="cw-card-elevated">
              <CardContent className="py-16 md:py-20 px-6 text-center">
                <div className="cw-request-success-icon mb-5 mx-auto">
                  <UserRound className="h-8 w-8" aria-hidden />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">No suggested matches yet</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                  We could not surface candidates for this request right now. Try updating the
                  role or skills on your request, then check back for new suggestions.
                </p>
                <Button asChild variant="outline" className="rounded-xl mt-8">
                  <Link to={detailHref}>Edit request</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <CompanyCandidateProfilePanel
        candidate={profileCandidate}
        invitationSent={profileInvitationSent}
        onClose={() => setProfileCandidate(null)}
        onInvite={() => {
          if (profileCandidate) openInvite(profileCandidate);
        }}
      />

      <CompanyCandidateInviteDialog
        candidate={inviteCandidate}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSent={handleInviteSent}
      />
    </div>
  );
}
