import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyWorkspaceLoading } from "@/components/company/CompanyWorkspaceLoading";
import { CompanyWorkspaceEmptyState } from "@/components/company/CompanyWorkspaceEmptyState";
import { CompanyWorkspaceErrorState } from "@/components/company/CompanyWorkspaceErrorState";
import {
  listCompanyProjectRequests,
  parseApiErrorMessage,
  type CompanyProjectRequestSummary,
} from "@/api/companyApi";
import {
  formatRequestDuration,
  getRequestLifecycleStatus,
  getRequestRoleLabels,
  getRequestSkillLabels,
  isRequestViewOnly,
  requestLifecycleStatusBadgeClass,
  requestLifecycleStatusLabel,
  requestTypeBadgeClass,
  requestTypeLabel,
} from "@/lib/companyRequestDisplay";
import { cn } from "@/lib/utils";
import { collaborationFormatLabel } from "@/constants/companyRequestCatalog";
import { COMPANY_ROUTES } from "@/routes/paths";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function requestDetailPath(id: number): string {
  return `${COMPANY_ROUTES.requests}/${id}`;
}

function RequestCard({ request }: { request: CompanyProjectRequestSummary }) {
  const roles = getRequestRoleLabels(request);
  const skills = getRequestSkillLabels(request);
  const lifecycleStatus = getRequestLifecycleStatus(request);
  const isViewOnly = isRequestViewOnly(lifecycleStatus);

  return (
    <Card className="cw-card-elevated cw-request-list-card">
      <CardContent className="cw-card-body">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 rounded-md text-[11px] font-medium",
                    requestTypeBadgeClass(request.requestType),
                  )}
                >
                  {requestTypeLabel(request.requestType)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 rounded-md text-[11px] font-medium capitalize",
                    requestLifecycleStatusBadgeClass(lifecycleStatus),
                  )}
                >
                  {requestLifecycleStatusLabel(lifecycleStatus)}
                </Badge>
              </div>
              <h3 className="cw-request-title">
                <Link
                  to={requestDetailPath(request.id)}
                  className="hover:text-primary transition-colors"
                >
                  {request.title}
                </Link>
              </h3>
            </div>

            {roles.length > 0 && (
              <div>
                <p className="cw-section-label mb-2">Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <Badge key={role} className="cw-request-role-chip rounded-md">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {skills.length > 0 && (
              <div>
                <p className="cw-section-label mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <Badge key={skill} className="cw-request-skill-badge rounded-md text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs cw-text-secondary pt-0.5">
              {formatRequestDuration(request)}
              {request.collaborationType &&
                ` · ${collaborationFormatLabel(request.collaborationType)}`}
              {" · "}
              Created {formatDate(request.createdAt)}
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-2.5 lg:min-w-[11rem] lg:pt-1">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl w-full cw-btn-outline h-9"
              asChild
            >
              <Link to={requestDetailPath(request.id)}>View details</Link>
            </Button>
            <Button
              size="sm"
              className="rounded-xl w-full cw-btn-gradient border-0 shadow-sm h-9"
              asChild
            >
              <Link to={COMPANY_ROUTES.requestRecommendations(request.id)}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {isViewOnly ? "View recommendations" : "AI recommendations"}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompanyRequestsPage() {
  const [requests, setRequests] = useState<CompanyProjectRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listCompanyProjectRequests()
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(parseApiErrorMessage(err));
          setRequests([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CompanyPageShell>
      <CompanyPageHeader
        title="Project Requests"
        subtitle="Requests for AI matching — individual contributors or AI-built team compositions."
        actions={
          <Button asChild className="rounded-xl cw-btn-gradient shadow-sm border-0">
            <Link to={COMPANY_ROUTES.newRequest}>
              <Plus className="h-4 w-4 mr-1" /> Create Project Request
            </Link>
          </Button>
        }
      />

      {loading && (
        <Card className="cw-card-elevated">
          <CardContent className="cw-card-body">
            <CompanyWorkspaceLoading message="Loading requests…" />
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card className="cw-card-elevated">
          <CardContent className="cw-card-body">
            <CompanyWorkspaceErrorState
              message={error}
              onRetry={() => window.location.reload()}
            />
          </CardContent>
        </Card>
      )}

      {!loading && !error && requests.length === 0 && (
        <Card className="cw-card-elevated">
          <CardContent className="cw-card-body">
            <CompanyWorkspaceEmptyState
              icon={FileText}
              eyebrow="Project requests"
              title="No project requests yet"
              description="Create your first request and let SkillSwap AI recommend students and teams that match your requirements."
              action={{ label: "Create request", to: COMPANY_ROUTES.newRequest }}
            />
          </CardContent>
        </Card>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="flex flex-col cw-grid-gap">
          <div className="cw-page-meta">
            <Badge variant="secondary" className="cw-badge-ai rounded-md px-2.5 py-0.5 text-xs">
              {requests.length} request{requests.length === 1 ? "" : "s"}
            </Badge>
          </div>
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </CompanyPageShell>
  );
}
