import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Plus,
  FileText,
  Bookmark,
  Users,
  UsersRound,
  TrendingUp,
  Inbox,
  ArrowRight,
  UserRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCompanyDashboard, type CompanyDashboard } from "@/api/companyApi";
import { CompanyMatchScoreBadge } from "@/components/company/CompanyMatchScoreBadge";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyCardHeader } from "@/components/company/CompanyCardHeader";
import { CompanyLinkAction } from "@/components/company/CompanyLinkAction";
import { CompanyWorkspaceEmptyState } from "@/components/company/CompanyWorkspaceEmptyState";
import { CompanyWorkspaceLoading } from "@/components/company/CompanyWorkspaceLoading";
import {
  requestLifecycleStatusBadgeClass,
  requestLifecycleStatusLabel,
} from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/routes/paths";
import { cn } from "@/lib/utils";

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

function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(iso);
  } catch {
    return "";
  }
}

const METRIC_CARD_VARIANTS = [
  "cw-metric-card--lavender",
  "cw-metric-card--periwinkle",
  "cw-metric-card--blue",
  "cw-metric-card--indigo",
] as const;

const METRIC_ICON_VARIANTS = [
  "cw-metric-icon--lavender",
  "cw-metric-icon--periwinkle",
  "cw-metric-icon--blue",
  "cw-metric-icon--indigo",
] as const;

function MetricCard({
  label,
  value,
  icon: Icon,
  loading,
  iconVariant = 0,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  loading: boolean;
  iconVariant?: number;
}) {
  const v = iconVariant % 4;
  return (
    <div className={cn("cw-metric-card", METRIC_CARD_VARIANTS[v])}>
      <div className="flex items-start justify-between mb-3.5">
        <span className={cn("cw-metric-icon", METRIC_ICON_VARIANTS[v])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {loading ? "—" : value}
      </div>
      <div className="text-sm font-medium mt-1.5 cw-text-secondary">{label}</div>
    </div>
  );
}

export function CompanyDashboardPage() {
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    getCompanyDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setDashboard(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const companyName = dashboard?.companyName?.trim() || "Your company";
  const activeRequests = dashboard?.activeRequests ?? 0;
  const previewCount = dashboard?.activeRequestsPreview.length ?? 0;
  const hasMoreRequests = activeRequests > previewCount;

  return (
    <CompanyPageShell>
      {/* Home hero — unique to Dashboard */}
      <div className="relative overflow-hidden rounded-2xl border bg-card cw-hero-bg cw-hero-premium p-8 md:p-10 md:py-12">
        <div
          className="cw-hero-blob cw-hero-blob--lavender -top-20 -right-16 h-64 w-64"
          aria-hidden
        />
        <div
          className="cw-hero-blob cw-hero-blob--periwinkle -bottom-24 -left-12 h-48 w-48"
          aria-hidden
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <Badge className="cw-badge-ai rounded-full px-2.5 py-0.5 hover:bg-primary/10 border-0 shadow-none">
              <Sparkles className="h-3 w-3 mr-1" /> AI Discovery Workspace
            </Badge>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
              Welcome back, <span className="cw-gradient-text">{companyName}</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Discover students and AI-generated teams that match your project needs.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button asChild size="lg" className="rounded-xl cw-btn-gradient border-0 shadow-sm">
              <Link to={COMPANY_ROUTES.newRequest}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Request
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl cw-btn-outline">
              <Link to={COMPANY_ROUTES.saved}>
                View Saved Recommendations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 cw-grid-gap-compact">
        <MetricCard
          label="Active Requests"
          value={dashboard?.activeRequests ?? 0}
          icon={FileText}
          loading={loading}
          iconVariant={0}
        />
        <MetricCard
          label="Saved Students"
          value={dashboard?.savedStudents ?? 0}
          icon={UserRound}
          loading={loading}
          iconVariant={1}
        />
        <MetricCard
          label="Saved Teams"
          value={dashboard?.savedTeams ?? 0}
          icon={UsersRound}
          loading={loading}
          iconVariant={2}
        />
        <MetricCard
          label="Workspace Members"
          value={dashboard?.workspaceMembers ?? 0}
          icon={Users}
          loading={loading}
          iconVariant={3}
        />
      </div>

      {loadError ? (
        <Card className="cw-card-elevated">
          <CardContent className="cw-card-body">
            <CompanyWorkspaceEmptyState
              compact
              icon={Inbox}
              title="Could not load your dashboard"
              description="Please refresh the page or try again in a moment."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 cw-grid-gap">
            <Card className="cw-card-elevated lg:col-span-2">
              <CompanyCardHeader
                icon={FileText}
                title="Active Requests"
                description="Your open collaboration requests and saved shortlists."
                action={
                  hasMoreRequests ? (
                    <CompanyLinkAction to={COMPANY_ROUTES.requests}>View all →</CompanyLinkAction>
                  ) : undefined
                }
              />
              <CardContent className="cw-card-body cw-card-body--flush-top">
                {loading ? (
                  <CompanyWorkspaceLoading message="Loading requests…" />
                ) : activeRequests === 0 ? (
                  <CompanyWorkspaceEmptyState
                    compact
                    icon={FileText}
                    title="No active requests yet"
                    description="Create your first collaboration request to start discovering students and AI-generated teams."
                    action={{
                      label: "Create request",
                      to: COMPANY_ROUTES.newRequest,
                    }}
                  />
                ) : (
                  <div className="cw-list-stack">
                    {dashboard?.activeRequestsPreview.map((request) => (
                      <div key={request.id} className="cw-list-item">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm">
                                {request.title?.trim() || "Untitled project request"}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`rounded-md text-[11px] ${requestLifecycleStatusBadgeClass(request.status)}`}
                              >
                                {requestLifecycleStatusLabel(request.status)}
                              </Badge>
                            </div>
                            {request.requestedRole && request.requestedRole !== "—" && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {request.requestedRole}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-2">
                              Created {formatDate(request.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2.5 shrink-0">
                            <div className="cw-stat-pill">
                              <span className="cw-stat-pill-value">{request.savedStudentsCount}</span>
                              <span className="cw-stat-pill-label">Students</span>
                            </div>
                            <div className="cw-stat-pill">
                              <span className="cw-stat-pill-value">{request.savedTeamsCount}</span>
                              <span className="cw-stat-pill-label">Teams</span>
                            </div>
                          </div>
                        </div>
                        <div className="cw-list-item-actions">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="rounded-lg cw-btn-outline"
                          >
                            <Link to={COMPANY_ROUTES.requestDetail(request.id)}>View request</Link>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            className="rounded-lg cw-btn-gradient border-0 shadow-sm"
                          >
                            <Link to={COMPANY_ROUTES.requestRecommendations(request.id)}>
                              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                              AI recommendations
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="cw-card-elevated">
              <CompanyCardHeader
                icon={TrendingUp}
                title="Workspace Activity"
                description="Recent actions across your workspace"
              />
              <CardContent className="cw-card-body cw-card-body--flush-top">
                {loading ? (
                  <CompanyWorkspaceLoading message="Loading activity…" />
                ) : !dashboard?.recentActivity.length ? (
                  <CompanyWorkspaceEmptyState
                    compact
                    icon={TrendingUp}
                    title="No activity yet"
                    description="Workspace actions from your team will appear here."
                  />
                ) : (
                  <ol className="cw-timeline">
                    {dashboard.recentActivity.map((item) => (
                      <li key={item.id} className="cw-timeline-item">
                        <div className="cw-timeline-dot" aria-hidden />
                        <p className="text-sm leading-snug text-foreground">{item.description}</p>
                        <p className="text-xs cw-text-secondary mt-1">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 cw-grid-gap">
            <Card className="cw-card-elevated">
              <CompanyCardHeader
                icon={Bookmark}
                title="Recently Saved Candidates"
                description="Shortlisted students from your requests"
                action={
                  (dashboard?.savedStudents ?? 0) > 0 ? (
                    <CompanyLinkAction to={COMPANY_ROUTES.saved}>View all →</CompanyLinkAction>
                  ) : undefined
                }
              />
              <CardContent className="cw-card-body cw-card-body--flush-top">
                {loading ? (
                  <CompanyWorkspaceLoading message="Loading candidates…" />
                ) : !dashboard?.recentSavedStudents.length ? (
                  <CompanyWorkspaceEmptyState
                    compact
                    icon={Bookmark}
                    title="No saved candidates yet"
                    description="Shortlisted students from your requests will appear here."
                    action={
                      activeRequests > 0
                        ? { label: "Browse recommendations", to: COMPANY_ROUTES.requests, variant: "outline" }
                        : undefined
                    }
                  />
                ) : (
                  <div className="cw-list-stack">
                    {dashboard.recentSavedStudents.map((student) => (
                      <div
                        key={`${student.companyRequestId}-${student.studentProfileId}`}
                        className="cw-list-item flex items-center gap-3"
                      >
                        <div className="cw-avatar-chip">
                          {student.studentName
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{student.studentName}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {[student.university, student.major].filter(Boolean).join(" · ") ||
                              "—"}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Saved {formatDate(student.savedAt)}
                          </div>
                        </div>
                        {student.matchScore != null && (
                          <CompanyMatchScoreBadge score={student.matchScore} size="sm" />
                        )}
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-lg shrink-0 cw-btn-outline"
                        >
                          <Link
                            to={COMPANY_ROUTES.studentDiscoveryProfile(
                              student.companyRequestId,
                              student.studentProfileId,
                            )}
                          >
                            View profile
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="cw-card-elevated">
              <CompanyCardHeader
                icon={UsersRound}
                title="Recently Saved Teams"
                description="AI-built teams you bookmarked"
                action={
                  (dashboard?.savedTeams ?? 0) > 0 ? (
                    <CompanyLinkAction to={COMPANY_ROUTES.saved}>View all →</CompanyLinkAction>
                  ) : undefined
                }
              />
              <CardContent className="cw-card-body cw-card-body--flush-top">
                {loading ? (
                  <CompanyWorkspaceLoading message="Loading teams…" />
                ) : !dashboard?.recentSavedTeams.length ? (
                  <CompanyWorkspaceEmptyState
                    compact
                    icon={UsersRound}
                    title="No saved teams yet"
                    description="AI-generated teams you bookmark will appear here."
                    action={
                      activeRequests > 0
                        ? { label: "Browse requests", to: COMPANY_ROUTES.requests, variant: "outline" }
                        : undefined
                    }
                  />
                ) : (
                  <div className="cw-list-stack">
                    {dashboard.recentSavedTeams.map((team) => (
                      <div
                        key={`${team.companyRequestId}-${team.teamRecommendationId}`}
                        className="cw-list-item"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-sm">{team.teamName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              Saved {formatDate(team.savedAt)}
                            </div>
                          </div>
                          {team.matchScore > 0 && (
                            <CompanyMatchScoreBadge score={team.matchScore} size="sm" />
                          )}
                        </div>
                        <div className="cw-list-item-actions">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="rounded-lg cw-btn-outline"
                          >
                            <Link
                              to={COMPANY_ROUTES.teamDiscoveryProfile(
                                team.companyRequestId,
                                team.teamRecommendationId,
                              )}
                            >
                              View team
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </CompanyPageShell>
  );
}
