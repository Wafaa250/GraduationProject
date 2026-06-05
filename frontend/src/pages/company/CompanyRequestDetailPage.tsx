import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyLuxHero, CompanyLuxPanel } from "@/components/company/CompanyPremiumUI";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanySkeleton } from "@/components/company/CompanySkeleton";
import { CompanyEmptyState } from "@/components/company/CompanyEmptyState";
import { CompanyRequestReviewStat } from "@/components/company/CompanyRequestReviewStat";
import { CompanyRequestAnalyzeCta } from "@/components/company/CompanyRequestAnalyzeCta";
import { CompanyRequestMetaTags } from "@/components/company/CompanyRequestMetaTags";
import {
  getRequestRoleLabels,
  getRequestRoleSubtitle,
} from "@/lib/companyRequestDisplay";
import { CompanyRequestActionsMenu } from "@/components/company/CompanyRequestActionsMenu";
import { CompanyRequestVisibilityPanel } from "@/components/company/CompanyRequestVisibilityPanel";
import { CompanyOpportunityStudentView } from "@/components/company/CompanyOpportunityStudentView";
import { ConfirmDialog } from "@/components/company/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  deleteCompanyProjectRequest,
  getCompanyProjectRequest,
  parseApiErrorMessage,
  publishCompanyProjectRequest,
  unpublishCompanyProjectRequest,
  updateCompanyProjectRequestStatus,
  type CompanyProjectRequestDetail,
} from "@/api/companyApi";
import {
  formatRequestDuration,
  getRequestLifecycleStatus,
  getRequestProjectTitle,
  isRequestViewOnly,
  requestHubVisibilityBadgeClass,
  requestHubVisibilityLabel,
  requestLifecycleStatusLabel,
  requestTypeLabel,
} from "@/lib/companyRequestDisplay";
import { collaborationFormatLabel } from "@/constants/companyRequestCatalog";
import {
  getPublicCompanyOpportunity,
  type PublicCompanyOpportunityDetail,
} from "@/api/organizationsPublicApi";
import { COMPANY_ROUTES, ROUTES } from "@/routes/paths";
import "@/styles/student-company-opportunity.css";

export function CompanyRequestDetailPage() {
  const { id, companyProfileId: companyProfileIdParam, requestId: requestIdParam } =
    useParams<{ id: string; companyProfileId: string; requestId: string }>();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const isStudent = (localStorage.getItem("role") ?? "").toLowerCase() === "student";
  const companyProfileId = Number(
    companyProfileIdParam ?? searchParams.get("companyId") ?? 0,
  );
  const [request, setRequest] = useState<CompanyProjectRequestDetail | null>(null);
  const [opportunity, setOpportunity] = useState<PublicCompanyOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const numId = Number(requestIdParam ?? id);

  useEffect(() => {
    if (!Number.isFinite(numId) || numId < 1) {
      setError("Invalid request.");
      setLoading(false);
      return;
    }
    if (isStudent && (!Number.isFinite(companyProfileId) || companyProfileId < 1)) {
      setError("Invalid company link.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = isStudent
      ? getPublicCompanyOpportunity(companyProfileId, numId)
      : getCompanyProjectRequest(numId);

    load
      .then((data) => {
        if (cancelled) return;
        if (isStudent) {
          setOpportunity(data as PublicCompanyOpportunityDetail);
          setRequest(null);
        } else {
          setRequest(data as CompanyProjectRequestDetail);
          setOpportunity(null);
        }
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
  }, [numId, isStudent, companyProfileId]);

  const reviewSkills = useMemo(() => {
    if (!request?.roles) return [];
    const set = new Set<string>();
    request.roles.forEach((r) => r.skills.forEach((s) => set.add(s.skillName)));
    return [...set];
  }, [request]);

  if (isStudent) {
    return (
      <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6 lg:px-8">
        <Link to={ROUTES.communicationHub} className="company-opportunity-detail__back">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Communication Hub
        </Link>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading opportunity…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : opportunity ? (
          <CompanyOpportunityStudentView opportunity={opportunity} />
        ) : null}
      </div>
    );
  }

  const isIndividual = request?.requestType === "individual";
  const isTeam = request?.requestType === "ai-built-team";
  const lifecycleStatus = request ? getRequestLifecycleStatus(request) : "active";
  const isViewOnly = isRequestViewOnly(lifecycleStatus);

  const setLifecycleStatus = async (status: string, successMessage: string) => {
    if (!request) return;
    setStatusLoading(true);
    try {
      const updated = await updateCompanyProjectRequestStatus(request.id, status);
      setRequest(updated);
      toast.success(successMessage);
    } catch (err) {
      toast.error(parseApiErrorMessage(err));
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!request) return;
    setPublishLoading(true);
    try {
      const updated = await publishCompanyProjectRequest(request.id);
      setRequest(updated);
      toast.success("Opportunity published to Communication Hub");
    } catch (err) {
      toast.error(parseApiErrorMessage(err));
    } finally {
      setPublishLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!request) return;
    setPublishLoading(true);
    try {
      const updated = await unpublishCompanyProjectRequest(request.id);
      setRequest(updated);
      toast.success("Opportunity removed from Communication Hub");
    } catch (err) {
      toast.error(parseApiErrorMessage(err));
    } finally {
      setPublishLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!request) return;
    setDeleting(true);
    try {
      await deleteCompanyProjectRequest(request.id);
      toast.success("Request deleted");
      nav(COMPANY_ROUTES.requests);
    } catch (err) {
      toast.error(parseApiErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const heroDescription = request?.description?.trim() || undefined;
  const roleSubtitle = request ? getRequestRoleSubtitle(request) : null;
  const projectTitle = request ? getRequestProjectTitle(request) : "";
  const showRoleSubtitle =
    roleSubtitle &&
    roleSubtitle !== projectTitle &&
    !(request && getRequestRoleLabels(request).length === 1 && roleSubtitle === projectTitle);

  return (
    <CompanyPageShell className="space-y-6">
      {loading ? (
        <>
          <CompanySkeleton className="h-52 w-full rounded-[1.25rem]" />
          <CompanySkeleton className="h-48 w-full rounded-xl" />
          <CompanySkeleton className="h-96 w-full rounded-xl" />
        </>
      ) : error ? (
        <div className="cw-lux-panel">
          <div className="cw-lux-panel-body">
            <CompanyEmptyState icon={FileText} title="Request unavailable" message={error} />
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline" className="rounded-lg">
                <Link to={COMPANY_ROUTES.requests}>Back to requests</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : request ? (
        <>
          <CompanyLuxHero
            eyebrow="Project request"
            title={projectTitle}
            subtitle={showRoleSubtitle ? roleSubtitle : undefined}
            description={heroDescription}
            footer={<CompanyRequestMetaTags request={request} showSkills={false} />}
            actions={
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                >
                  <Link to={COMPANY_ROUTES.requests}>
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Back to requests</span>
                    <span className="sm:hidden">Back</span>
                  </Link>
                </Button>
                <span className="cw-lux-hero-toolbar-divider" aria-hidden />
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full h-7 px-2.5 font-medium",
                    requestHubVisibilityBadgeClass(request),
                  )}
                >
                  {requestHubVisibilityLabel(request)}
                </Badge>
                <CompanyRequestActionsMenu
                  editHref={COMPANY_ROUTES.editRequest(request.id)}
                  lifecycleStatus={lifecycleStatus}
                  statusLoading={statusLoading}
                  onPause={() => setLifecycleStatus("Paused", "Request paused")}
                  onReactivate={() => setLifecycleStatus("Active", "Request reactivated")}
                  onClose={() => setLifecycleStatus("Closed", "Request closed")}
                  onDelete={() => setDeleteOpen(true)}
                />
              </>
            }
          />

          {(lifecycleStatus === "paused" || lifecycleStatus === "closed") && (
            <div
              className={cn(
                "cw-status-banner",
                lifecycleStatus === "paused"
                  ? "cw-status-banner--paused"
                  : "cw-status-banner--closed",
              )}
            >
              <div>
                <p className="text-sm font-medium">
                  {lifecycleStatus === "paused" ? "Request Paused" : "This request has been closed."}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {lifecycleStatus === "paused"
                    ? "This request is view-only. Reactivate it to run AI matching, save candidates, or edit the request."
                    : "Recommendations remain visible for reference. Saving new candidates or teams is disabled."}
                </p>
              </div>
              {lifecycleStatus === "paused" && (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg shrink-0 cw-btn-gradient border-0"
                  disabled={statusLoading}
                  onClick={() => setLifecycleStatus("Active", "Request reactivated")}
                >
                  {statusLoading ? "Reactivating…" : "Reactivate Request"}
                </Button>
              )}
            </div>
          )}

          <CompanyRequestVisibilityPanel
            request={request}
            loading={publishLoading}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
          />

          <CompanyLuxPanel title="Request specifications">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <CompanyRequestReviewStat label="Type" value={requestTypeLabel(request.requestType)} />
              <CompanyRequestReviewStat label="Category" value={request.category || "—"} />
              <CompanyRequestReviewStat label="Duration" value={formatRequestDuration(request)} />
              <CompanyRequestReviewStat
                label="Format"
                value={collaborationFormatLabel(request.collaborationType) || "—"}
              />
              {isTeam ? (
                <CompanyRequestReviewStat
                  label="Roles"
                  value={String(request.roles.filter((r) => r.roleName).length)}
                />
              ) : null}
              <CompanyRequestReviewStat
                label="Status"
                value={requestLifecycleStatusLabel(lifecycleStatus)}
              />
            </div>
          </CompanyLuxPanel>

          <CompanyLuxPanel title="Requirements">
            {isIndividual && request.roles[0] ? (
              <div>
                <p className="cw-section-label mb-2">Role</p>
                <p className="font-semibold text-base">{request.roles[0].roleName}</p>
              </div>
            ) : null}
            {isTeam ? (
              <div className="space-y-3">
                {request.roles.map((r) => (
                  <div key={r.id} className="cw-role-slot-lux">
                    <p className="font-semibold text-sm">{r.roleName}</p>
                    {r.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {r.skills.map((s) => (
                          <Badge key={s.id} className="cw-request-skill-badge rounded-md text-xs">
                            {s.skillName}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {r.notes?.trim() ? (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{r.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            {reviewSkills.length > 0 ? (
              <div
                className={cn(
                  (isIndividual && request.roles[0]) || isTeam
                    ? "mt-5 pt-5 border-t border-border/60"
                    : undefined,
                )}
              >
                <p className="cw-section-label mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {reviewSkills.map((s) => (
                    <Badge key={s} className="cw-request-skill-badge rounded-md text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CompanyLuxPanel>

          {request.scopeNotes?.trim() ? (
            <CompanyLuxPanel title="Additional notes">
              <p className="cw-scope-notes">{request.scopeNotes}</p>
            </CompanyLuxPanel>
          ) : null}

          <CompanyRequestAnalyzeCta
            analyzeHref={COMPANY_ROUTES.requestRecommendations(request.id)}
            disabled={isViewOnly}
            disabledReason={
              lifecycleStatus === "paused"
                ? "Reactivate this request before running AI matching."
                : "This request has been closed."
            }
          />
        </>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this request?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </CompanyPageShell>
  );
}
