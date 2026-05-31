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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCompanyDashboard, type CompanyDashboard } from "@/api/companyApi";
import { CompanyMatchScoreBadge } from "@/components/company/CompanyMatchScoreBadge";
import {
  requestLifecycleStatusBadgeClass,
  requestLifecycleStatusLabel,
} from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/routes/paths";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { cwLayout } from "@/lib/companyLayout";

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

function EmptyBlock({
  icon: Icon,
  message,
  action,
}: {
  icon: typeof Inbox;
  message: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="py-10 px-4 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
      {action && (
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  loading: boolean;
}) {
  return (
    <Card className="cw-card-elevated hover:shadow-md transition-shadow">
      <CardContent className={cwLayout.cardPadding}>
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="text-3xl font-semibold tabular-nums">{loading ? "—" : value}</div>
        <div className="text-sm font-medium mt-0.5 text-foreground">{label}</div>
      </CardContent>
    </Card>
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
      {/* Hero */}
      <div className={cwLayout.hero}>
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0">
              <Sparkles className="h-3 w-3 mr-1" /> AI Discovery Workspace
            </Badge>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
              Welcome back,{" "}
              <span className="cw-gradient-text">{companyName}</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Discover students and AI-generated teams that match your project needs.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button asChild size="lg" className="rounded-xl cw-btn-gradient border-0">
              <Link to={COMPANY_ROUTES.newRequest}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Request
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link to={COMPANY_ROUTES.saved}>
                View Saved Recommendations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Requests"
          value={dashboard?.activeRequests ?? 0}
          icon={FileText}
          loading={loading}
        />
        <MetricCard
          label="Saved Students"
          value={dashboard?.savedStudents ?? 0}
          icon={UserRound}
          loading={loading}
        />
        <MetricCard
          label="Saved Teams"
          value={dashboard?.savedTeams ?? 0}
          icon={UsersRound}
          loading={loading}
        />
        <MetricCard
          label="Workspace Members"
          value={dashboard?.workspaceMembers ?? 0}
          icon={Users}
          loading={loading}
        />
      </div>

      {loadError ? (
        <Card className="cw-card-elevated">
          <CardContent>
            <EmptyBlock
              icon={Inbox}
              message="Could not load your dashboard. Please refresh the page."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Row 1: Active Requests + Activity */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="cw-card-elevated lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Active Requests</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Your open collaboration requests and saved shortlists.
                  </p>
                </div>
                {hasMoreRequests && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={COMPANY_ROUTES.requests}>View all</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
                ) : activeRequests === 0 ? (
                  <EmptyBlock
                    icon={FileText}
                    message="Create your first collaboration request to start discovering students and AI-generated teams."
                    action={{ label: "Create Request", to: COMPANY_ROUTES.newRequest }}
                  />
                ) : (
                  <div className="space-y-3">
                    {dashboard?.activeRequestsPreview.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 rounded-xl border bg-gradient-to-br from-card to-muted/20 hover:border-primary/30 transition-colors"
                      >
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
                          <div className="flex gap-4 text-center shrink-0">
                            <div>
                              <div className="font-semibold text-lg cw-gradient-text tabular-nums">
                                {request.savedStudentsCount}
                              </div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Students
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-lg cw-gradient-text tabular-nums">
                                {request.savedTeamsCount}
                              </div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Teams
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button asChild size="sm" variant="outline" className="rounded-lg">
                            <Link to={COMPANY_ROUTES.requestDetail(request.id)}>
                              View Request
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Workspace Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
                ) : !dashboard?.recentActivity.length ? (
                  <EmptyBlock
                    icon={TrendingUp}
                    message="Workspace actions from your team will appear here."
                  />
                ) : (
                  <ol className="relative border-l border-border ml-2 space-y-5">
                    {dashboard.recentActivity.map((item) => (
                      <li key={item.id} className="pl-4 relative">
                        <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-card" />
                        <p className="text-sm leading-snug">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Saved Students + Saved Teams */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="cw-card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Recently Saved Candidates</CardTitle>
                {(dashboard?.savedStudents ?? 0) > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={COMPANY_ROUTES.saved}>View all</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
                ) : !dashboard?.recentSavedStudents.length ? (
                  <EmptyBlock
                    icon={Bookmark}
                    message="Shortlisted candidates from your requests will appear here."
                    action={
                      activeRequests > 0
                        ? { label: "Browse recommendations", to: COMPANY_ROUTES.requests }
                        : undefined
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {dashboard.recentSavedStudents.map((student) => (
                      <div
                        key={`${student.companyRequestId}-${student.studentProfileId}`}
                        className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/30 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
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
                        <Button asChild size="sm" variant="outline" className="rounded-lg shrink-0">
                          <Link
                            to={COMPANY_ROUTES.studentDiscoveryProfile(
                              student.companyRequestId,
                              student.studentProfileId,
                            )}
                          >
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="cw-card-elevated relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 blur-2xl rounded-full pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-3 relative">
                <CardTitle className="text-base flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-primary" />
                  Recently Saved Teams
                </CardTitle>
                {(dashboard?.savedTeams ?? 0) > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={COMPANY_ROUTES.saved}>View all</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-0 relative">
                {loading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
                ) : !dashboard?.recentSavedTeams.length ? (
                  <EmptyBlock
                    icon={UsersRound}
                    message="AI-generated teams you save will appear here."
                    action={
                      activeRequests > 0
                        ? { label: "Browse requests", to: COMPANY_ROUTES.requests }
                        : undefined
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {dashboard.recentSavedTeams.map((team) => (
                      <div
                        key={`${team.companyRequestId}-${team.teamRecommendationId}`}
                        className="p-4 rounded-xl border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{team.teamName}</div>
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
                        <Button asChild size="sm" variant="outline" className="rounded-lg mt-3">
                          <Link
                            to={COMPANY_ROUTES.teamDiscoveryProfile(
                              team.companyRequestId,
                              team.teamRecommendationId,
                            )}
                          >
                            View Team
                          </Link>
                        </Button>
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
