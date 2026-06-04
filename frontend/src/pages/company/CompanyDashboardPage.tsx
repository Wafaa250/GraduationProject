import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  FileText,
  Bookmark,
  Users,
  UsersRound,
  TrendingUp,
  ArrowRight,
  UserRound,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCompanyDashboard, type CompanyDashboard } from "@/api/companyApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { CompanyMatchScoreBadge } from "@/components/company/CompanyMatchScoreBadge";
import { CompanyEmptyState } from "@/components/company/CompanyEmptyState";
import { DashboardSkeleton } from "@/components/company/CompanySkeleton";
import {
  CompanyLuxHero,
  CompanyLuxStat,
  CompanyLuxPanel,
} from "@/components/company/CompanyPremiumUI";
import {
  requestLifecycleStatusBadgeClass,
  requestLifecycleStatusLabel,
} from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/routes/paths";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { isCompanyOwner } from "@/lib/companyWorkspace";
import { cn } from "@/lib/utils";

const RECENT_ACTIVITY_LIMIT = 5;

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

export function CompanyDashboardPage() {
  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getCompanyDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(parseApiErrorMessage(err));
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
  const savedStudents = dashboard?.savedStudents ?? 0;
  const savedTeams = dashboard?.savedTeams ?? 0;
  const previewCount = dashboard?.activeRequestsPreview.length ?? 0;
  const hasMoreRequests = activeRequests > previewCount;
  const showMembersLink = isCompanyOwner();

  const recentActivity = useMemo(
    () => (dashboard?.recentActivity ?? []).slice(0, RECENT_ACTIVITY_LIMIT),
    [dashboard?.recentActivity],
  );

  if (loading) {
    return (
      <CompanyPageShell>
        <DashboardSkeleton />
      </CompanyPageShell>
    );
  }

  return (
    <CompanyPageShell className="space-y-7">
      <CompanyLuxHero
        eyebrow="AI Discovery Workspace"
        title={
          <>
            Welcome back,{" "}
            <span className="text-[hsl(var(--cw-accent))]">{companyName}</span>
          </>
        }
        description="Discover students and AI-generated teams that match your project needs."
        actions={
          <>
            <Button asChild size="default" className="rounded-lg h-10 cw-btn-gradient border-0 px-5 shadow-md">
              <Link to={COMPANY_ROUTES.newRequest}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Request
              </Link>
            </Button>
            <Button asChild size="default" variant="outline" className="rounded-lg h-10 px-5 bg-background/60">
              <Link to={COMPANY_ROUTES.saved}>
                View Saved Recommendations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </>
        }
      />

      {loadError ? (
        <div className="cw-lux-panel">
          <div className="cw-lux-panel-body">
            <CompanyEmptyState icon={Building2} title="Unable to load dashboard" message={loadError} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 cw-animate-stagger">
            <CompanyLuxStat
              label="Active Requests"
              value={activeRequests}
              icon={FileText}
              href={COMPANY_ROUTES.requests}
              delay={0}
            />
            <CompanyLuxStat
              label="Saved Students"
              value={savedStudents}
              icon={UserRound}
              href={COMPANY_ROUTES.saved}
              accent="ai"
              delay={60}
            />
            <CompanyLuxStat
              label="Saved Teams"
              value={savedTeams}
              icon={UsersRound}
              href={COMPANY_ROUTES.saved}
              delay={120}
            />
            <CompanyLuxStat
              label="Workspace Members"
              value={dashboard?.workspaceMembers ?? 0}
              icon={Users}
              href={showMembersLink ? COMPANY_ROUTES.members : undefined}
              delay={180}
            />
          </div>

          <div className="cw-bento-grid cw-bento-grid--dashboard gap-5">
            <div className="cw-bento-span-8 space-y-5">
              <CompanyLuxPanel
                title="Active Requests"
                description="Your open collaboration requests and saved shortlists."
                action={
                  hasMoreRequests ? (
                    <Button asChild variant="ghost" size="sm" className="h-8 text-xs rounded-lg">
                      <Link to={COMPANY_ROUTES.requests}>View all</Link>
                    </Button>
                  ) : null
                }
              >
                {activeRequests === 0 ? (
                  <CompanyEmptyState
                    compact
                    icon={FileText}
                    message="Create your first collaboration request to start discovering students and AI-generated teams."
                    action={{ label: "Create Request", to: COMPANY_ROUTES.newRequest }}
                  />
                ) : (
                  <div className="space-y-2 -mx-1">
                    {dashboard?.activeRequestsPreview.map((request) => (
                      <div key={request.id} className="cw-pipeline-lux-row">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={COMPANY_ROUTES.requestDetail(request.id)}
                              className="font-semibold text-sm hover:text-[hsl(var(--cw-accent))] transition-colors"
                            >
                              {request.title?.trim() || "Untitled project request"}
                            </Link>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-md text-[10px] h-5",
                                requestLifecycleStatusBadgeClass(request.status),
                              )}
                            >
                              {requestLifecycleStatusLabel(request.status)}
                            </Badge>
                          </div>
                          {request.requestedRole && request.requestedRole !== "—" ? (
                            <p className="text-sm text-muted-foreground mt-1 truncate max-w-md">
                              {request.requestedRole}
                            </p>
                          ) : null}
                          <p className="text-[11px] text-muted-foreground mt-2">
                            Created {formatDate(request.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-5 text-center shrink-0">
                          <div>
                            <p className="text-lg font-semibold tabular-nums text-[hsl(var(--cw-accent))]">
                              {request.savedStudentsCount}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Students
                            </p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold tabular-nums text-[hsl(var(--cw-accent))]">
                              {request.savedTeamsCount}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Teams
                            </p>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline" className="rounded-lg h-8 shrink-0">
                          <Link to={COMPANY_ROUTES.requestDetail(request.id)}>View Request</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CompanyLuxPanel>

              <div className="grid md:grid-cols-2 gap-5">
                <CompanyLuxPanel
                  variant="glass"
                  title="Recently Saved Candidates"
                  action={
                    savedStudents > 0 ? (
                      <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                        <Link to={COMPANY_ROUTES.saved}>View all</Link>
                      </Button>
                    ) : null
                  }
                >
                  {!dashboard?.recentSavedStudents.length ? (
                    <CompanyEmptyState
                      compact
                      icon={Bookmark}
                      message="Shortlisted candidates from your requests will appear here."
                      action={
                        activeRequests > 0
                          ? { label: "Browse recommendations", to: COMPANY_ROUTES.requests }
                          : undefined
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      {dashboard.recentSavedStudents.map((student) => (
                        <div
                          key={`${student.companyRequestId}-${student.studentProfileId}`}
                          className="cw-shortlist-lux"
                        >
                          <div className="h-10 w-10 rounded-full cw-avatar-solid flex items-center justify-center text-xs shrink-0 font-semibold">
                            {student.studentName
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{student.studentName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[student.university, student.major].filter(Boolean).join(" · ") || "—"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Saved {formatDate(student.savedAt)}
                            </p>
                          </div>
                          {student.matchScore != null ? (
                            <CompanyMatchScoreBadge score={student.matchScore} size="sm" />
                          ) : null}
                          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg shrink-0">
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
                </CompanyLuxPanel>

                <CompanyLuxPanel
                  variant="glass"
                  title="Recently Saved Teams"
                  action={
                    savedTeams > 0 ? (
                      <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                        <Link to={COMPANY_ROUTES.saved}>View all</Link>
                      </Button>
                    ) : null
                  }
                >
                  {!dashboard?.recentSavedTeams.length ? (
                    <CompanyEmptyState
                      compact
                      icon={UsersRound}
                      message="AI-generated teams you save will appear here."
                      action={
                        activeRequests > 0
                          ? { label: "Browse requests", to: COMPANY_ROUTES.requests }
                          : undefined
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      {dashboard.recentSavedTeams.map((team) => (
                        <div
                          key={`${team.companyRequestId}-${team.teamRecommendationId}`}
                          className="cw-shortlist-lux"
                        >
                          <div className="h-10 w-10 rounded-xl cw-lux-stat-icon grid place-items-center shrink-0">
                            <UsersRound className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{team.teamName}</p>
                            <p className="text-xs text-muted-foreground">
                              {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Saved {formatDate(team.savedAt)}
                            </p>
                          </div>
                          {team.matchScore > 0 ? (
                            <CompanyMatchScoreBadge score={team.matchScore} size="sm" />
                          ) : null}
                          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg shrink-0">
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
                </CompanyLuxPanel>
              </div>
            </div>

            <div className="cw-bento-span-4">
              <CompanyLuxPanel
                title="Workspace Activity"
                action={
                  (dashboard?.recentActivity.length ?? 0) > RECENT_ACTIVITY_LIMIT ? (
                    <span className="text-[11px] text-muted-foreground">Last {RECENT_ACTIVITY_LIMIT}</span>
                  ) : null
                }
              >
                {!recentActivity.length ? (
                  <CompanyEmptyState
                    compact
                    icon={TrendingUp}
                    message="Workspace actions from your team will appear here."
                  />
                ) : (
                  <ul className="cw-activity-timeline space-y-4">
                    {recentActivity.map((item) => (
                      <li key={item.id} className="cw-activity-timeline-item">
                        <p className="text-sm leading-snug">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CompanyLuxPanel>
            </div>
          </div>
        </>
      )}
    </CompanyPageShell>
  );
}
