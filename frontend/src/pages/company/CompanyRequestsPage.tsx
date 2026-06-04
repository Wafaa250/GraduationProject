import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyLuxHero, CompanyLuxStat } from "@/components/company/CompanyPremiumUI";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyEmptyState } from "@/components/company/CompanyEmptyState";
import { CompanySkeleton } from "@/components/company/CompanySkeleton";
import { cwLayout } from "@/lib/companyLayout";
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
    <article className="cw-lux-panel cw-request-list-card">
      <div className="cw-lux-panel-body !pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="font-semibold text-base tracking-tight leading-snug">
                <Link
                  to={requestDetailPath(request.id)}
                  className="hover:text-[hsl(var(--cw-accent))] transition-colors"
                >
                  {request.title}
                </Link>
              </h3>
              <Badge variant="outline" className="shrink-0 rounded-md text-[10px] font-medium h-5">
                {requestTypeLabel(request.requestType)}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 rounded-md text-[10px] font-medium h-5 capitalize",
                  requestLifecycleStatusBadgeClass(lifecycleStatus),
                )}
              >
                {requestLifecycleStatusLabel(lifecycleStatus)}
              </Badge>
            </div>

            {roles.length > 0 && (
              <div>
                <p className="cw-section-label mb-2">Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <Badge key={role} variant="secondary" className="rounded-md text-xs font-normal">
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
                  {skills.slice(0, 8).map((skill) => (
                    <Badge key={skill} variant="outline" className="rounded-md text-xs font-normal">
                      {skill}
                    </Badge>
                  ))}
                  {skills.length > 8 ? (
                    <Badge variant="outline" className="rounded-md text-xs font-normal">
                      +{skills.length - 8}
                    </Badge>
                  ) : null}
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

          <div className="shrink-0 flex flex-row lg:flex-col gap-2 lg:min-w-[10.5rem]">
            <Button size="sm" variant="outline" className="rounded-lg h-9 flex-1 lg:flex-none" asChild>
              <Link to={requestDetailPath(request.id)}>View details</Link>
            </Button>
            <Button
              size="sm"
              className="rounded-lg h-9 flex-1 lg:flex-none cw-btn-gradient border-0"
              asChild
            >
              <Link to={COMPANY_ROUTES.requestRecommendations(request.id)}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                {isViewOnly ? "View matches" : "AI recommendations"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function RequestsSkeleton() {
  return (
    <div className="space-y-4">
      <CompanySkeleton className="h-10 w-48 rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => (
        <CompanySkeleton key={i} className="h-44 rounded-xl" />
      ))}
    </div>
  );
}

export function CompanyRequestsPage() {
  const [requests, setRequests] = useState<CompanyProjectRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, paused: 0, closed: 0 };
    for (const r of requests) {
      const status = getRequestLifecycleStatus(r);
      if (status === "active") counts.active += 1;
      else if (status === "paused") counts.paused += 1;
      else if (status === "closed") counts.closed += 1;
    }
    return counts;
  }, [requests]);

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
    <CompanyPageShell className="space-y-6">
      <CompanyLuxHero
        eyebrow="Hiring pipeline"
        title="Project Requests"
        description="Your ATS-style workspace — define roles, track lifecycle, and launch AI recommendations per request."
        actions={
          <Button asChild className="rounded-lg h-10 cw-btn-gradient border-0 shadow-md">
            <Link to={COMPANY_ROUTES.newRequest}>
              <Plus className="h-4 w-4 mr-2" /> New request
            </Link>
          </Button>
        }
      />

      {loading && <RequestsSkeleton />}

      {!loading && error && (
        <div className="cw-card-elevated">
          <div className="py-8 text-center">
            <CompanyEmptyState icon={FileText} title="Could not load requests" message={error} />
            <Button
              variant="outline"
              className="rounded-lg mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="cw-card-elevated">
          <CompanyEmptyState
            icon={FileText}
            title="No project requests yet"
            message="Create your first request and let SkillSwap AI recommend students and teams that match your requirements."
            action={{ label: "Create request", to: COMPANY_ROUTES.newRequest }}
          />
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className={cn(cwLayout.section, "space-y-5")}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 cw-animate-stagger">
            <CompanyLuxStat label="Total" value={requests.length} icon={FileText} delay={0} />
            <CompanyLuxStat label="Active" value={statusCounts.active} icon={Sparkles} accent="ai" delay={60} />
            <CompanyLuxStat label="Paused" value={statusCounts.paused} icon={FileText} delay={120} />
            <CompanyLuxStat label="Closed" value={statusCounts.closed} icon={FileText} delay={180} />
          </div>

          <div className="space-y-4">
            {requests.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        </div>
      )}
    </CompanyPageShell>
  );
}
