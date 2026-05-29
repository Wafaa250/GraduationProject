import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyPageHeader } from "@/components/company/PageHeader";
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
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="font-semibold text-lg tracking-tight leading-snug">
                <Link
                  to={requestDetailPath(request.id)}
                  className="hover:text-primary transition-colors"
                >
                  {request.title}
                </Link>
              </h3>
              <Badge variant="outline" className="shrink-0 rounded-md text-xs font-normal">
                {requestTypeLabel(request.requestType)}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 rounded-md text-xs font-normal capitalize",
                  requestLifecycleStatusBadgeClass(lifecycleStatus),
                )}
              >
                {requestLifecycleStatusLabel(lifecycleStatus)}
              </Badge>
            </div>

            {roles.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
                  Roles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="rounded-md text-xs font-normal"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {skills.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <Badge key={skill} className="cw-request-skill-badge rounded-md text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {formatRequestDuration(request)}
              {request.collaborationType &&
                ` · ${collaborationFormatLabel(request.collaborationType)}`}
              {" · "}
              Created {formatDate(request.createdAt)}
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-2 lg:pt-0.5">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl w-full lg:w-auto"
              asChild
            >
              <Link to={requestDetailPath(request.id)}>View details</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl w-full lg:w-auto"
              asChild
            >
              <Link to={COMPANY_ROUTES.requestRecommendations(request.id)}>
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
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <CompanyPageHeader
        title="Project Requests"
        subtitle="Requests for AI matching — individual contributors or AI-built team compositions."
        actions={
          <Button asChild className="rounded-xl cw-btn-gradient shadow-sm">
            <Link to={COMPANY_ROUTES.newRequest}>
              <Plus className="h-4 w-4 mr-1" /> Create Project Request
            </Link>
          </Button>
        }
      />

      {loading && (
        <Card className="cw-card-elevated">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Loading requests…
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card className="cw-card-elevated">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="rounded-xl mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && requests.length === 0 && (
        <Card className="cw-card-elevated">
          <CardContent className="py-16 md:py-20 px-6 text-center">
            <div className="cw-request-success-icon mb-5">
              <FileText className="h-8 w-8" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">No project requests yet</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
              Create your first request and let SkillSwap AI recommend students that match your
              requirements.
            </p>
            <Button asChild className="mt-8 rounded-xl cw-btn-gradient shadow-sm" size="lg">
              <Link to={COMPANY_ROUTES.newRequest}>
                <Sparkles className="h-4 w-4 mr-2" />
                Create Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {requests.length} request{requests.length === 1 ? "" : "s"}
          </p>
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
