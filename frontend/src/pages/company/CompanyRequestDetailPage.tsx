import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyRequestReviewStat } from "@/components/company/CompanyRequestReviewStat";
import { CompanyRequestAnalyzeCta } from "@/components/company/CompanyRequestAnalyzeCta";
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
  requestStatusBadgeClass,
  requestStatusLabel,
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
  const isArchived = request?.status?.toLowerCase() === "archived";

  const setStatus = async (status: string, successMessage: string) => {
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
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <CompanyPageHeader
        title="Request details"
        subtitle={request?.title}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {request && (
              <CompanyRequestActionsMenu
                editHref={COMPANY_ROUTES.editRequest(request.id)}
                isArchived={isArchived}
                archiveLoading={statusLoading}
                onArchive={() => setStatus("archived", "Request archived")}
                onRestore={() => setStatus("submitted", "Request restored")}
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
        <Card className="cw-card-elevated">
          <CardContent className="p-6 md:p-8 lg:p-10">
            <div className="space-y-6">
              <div className="cw-request-review-hero">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Summary
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md text-xs font-normal capitalize",
                      requestStatusBadgeClass(request.status),
                    )}
                  >
                    {requestStatusLabel(request.status)}
                  </Badge>
                </div>
                <h3 className="text-xl md:text-2xl font-semibold mt-2 tracking-tight">
                  {request.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                  {request.description.trim() || "No description provided."}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
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
                </div>
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
                disabled={isArchived}
                disabledReason="Restore this request before running AI matching."
              />
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
}
