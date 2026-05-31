import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { cwLayout } from "@/lib/companyLayout";
import { CompanyRequestReviewStat } from "@/components/company/CompanyRequestReviewStat";
import { CompanyRequestAnalyzeCta } from "@/components/company/CompanyRequestAnalyzeCta";
import { CompanyRequestRecommendationSummary } from "@/components/company/CompanyRequestRecommendationSummary";
import { CompanyRequestActionsMenu } from "@/components/company/CompanyRequestActionsMenu";
import { ConfirmDialog } from "@/components/company/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  deleteCompanyProjectRequest,
  getCompanyProjectRequest,
  parseApiErrorMessage,
  updateCompanyProjectRequestStatus,
  type CompanyProjectRequestDetail,
} from "@/api/companyApi";
import {
  formatRequestDuration,
  getRequestLifecycleStatus,
  isRequestViewOnly,
  requestLifecycleStatusLabel,
  requestTypeLabel,
} from "@/lib/companyRequestDisplay";
import { collaborationFormatLabel } from "@/constants/companyRequestCatalog";
import { COMPANY_ROUTES } from "@/routes/paths";

export function CompanyRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [request, setRequest] = useState<CompanyProjectRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const numId = Number(id);

  useEffect(() => {
    if (!Number.isFinite(numId) || numId < 1) {
      setError("Invalid request.");
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

  const reviewSkills = useMemo(() => {
    if (!request?.roles) return [];
    const set = new Set<string>();
    request.roles.forEach((r) => r.skills.forEach((s) => set.add(s.skillName)));
    return [...set];
  }, [request]);

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

  return (
    <CompanyPageShell>
      <CompanyPageHeader
        title="Request details"
        subtitle={request?.title}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {request && (
              <CompanyRequestActionsMenu
                editHref={COMPANY_ROUTES.editRequest(request.id)}
                lifecycleStatus={lifecycleStatus}
                statusLoading={statusLoading}
                onPause={() => setLifecycleStatus("Paused", "Request paused")}
                onReactivate={() => setLifecycleStatus("Active", "Request reactivated")}
                onClose={() => setLifecycleStatus("Closed", "Request closed")}
                onDelete={() => setDeleteOpen(true)}
              />
            )}
            <Button asChild variant="outline" className="rounded-xl">
              <Link to={COMPANY_ROUTES.requests}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to requests
              </Link>
            </Button>
          </div>
        }
      />

      {loading && (
        <Card className="cw-card-elevated">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Loading request…
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card className="cw-card-elevated">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button asChild variant="outline" className="rounded-xl mt-4">
              <Link to={COMPANY_ROUTES.requests}>Back to requests</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && request && (
        <>
          {(lifecycleStatus === "paused" || lifecycleStatus === "closed") && (
            <div
              className={cn(
                "cw-status-banner mb-6",
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
                  className="rounded-xl shrink-0 cw-btn-gradient border-0 shadow-sm"
                  disabled={statusLoading}
                  onClick={() => setLifecycleStatus("Active", "Request reactivated")}
                >
                  {statusLoading ? "Reactivating…" : "Reactivate Request"}
                </Button>
              )}
            </div>
          )}

          <CompanyRequestRecommendationSummary request={request} variant="detail" />

          <Card className="cw-card-elevated">
            <CardContent className={cwLayout.cardPaddingLg}>
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <CompanyRequestReviewStat
                    label="Type"
                    value={requestTypeLabel(request.requestType)}
                  />
                  <CompanyRequestReviewStat label="Category" value={request.category || "—"} />
                  <CompanyRequestReviewStat
                    label="Duration"
                    value={formatRequestDuration(request)}
                  />
                  <CompanyRequestReviewStat
                    label="Format"
                    value={collaborationFormatLabel(request.collaborationType) || "—"}
                  />
                  {isTeam && (
                    <CompanyRequestReviewStat
                      label="Roles"
                      value={String(request.roles.filter((r) => r.roleName).length)}
                    />
                  )}
                  <CompanyRequestReviewStat
                    label="Status"
                    value={requestLifecycleStatusLabel(lifecycleStatus)}
                  />
                </div>

              <div className="cw-request-review-section">
                <p className="cw-request-review-section-title">Requirements</p>
                {isIndividual && request.roles[0] && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
                      Role
                    </p>
                    <p className="font-semibold text-base">{request.roles[0].roleName}</p>
                  </div>
                )}
                {isTeam && (
                  <div className="space-y-3">
                    {request.roles.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border bg-secondary/20 px-4 py-3 space-y-2"
                      >
                        <p className="font-semibold text-sm">{r.roleName}</p>
                        {r.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {r.skills.map((s) => (
                              <Badge
                                key={s.id}
                                className="cw-request-skill-badge rounded-md text-xs"
                              >
                                {s.skillName}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {r.notes?.trim() && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {r.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {reviewSkills.length > 0 && (
                  <div className={cn((isIndividual || isTeam) && "mt-5 pt-5 border-t")}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {reviewSkills.map((s) => (
                        <Badge key={s} className="cw-request-skill-badge rounded-md text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {request.scopeNotes?.trim() && (
                <div className="cw-request-review-section">
                  <p className="cw-request-review-section-title">Additional notes</p>
                  <p className="text-sm leading-relaxed">{request.scopeNotes}</p>
                </div>
              )}

              <CompanyRequestAnalyzeCta
                analyzeHref={COMPANY_ROUTES.requestRecommendations(request.id)}
                disabled={isViewOnly}
                disabledReason={
                  lifecycleStatus === "paused"
                    ? "Reactivate this request before running AI matching."
                    : "This request has been closed."
                }
              />
            </div>
          </CardContent>
        </Card>
        </>
      )}

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
