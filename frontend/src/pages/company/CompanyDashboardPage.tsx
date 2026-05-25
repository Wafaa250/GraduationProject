import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  Handshake,
  Clock,
  Plus,
  Target,
  MessageSquare,
  FileText,
  Users,
  UserRound,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listCompanyProjectRequests,
  type CompanyProjectRequestSummary,
} from "@/api/companyApi";
import { collaborationFormatLabel } from "@/constants/companyRequestCatalog";
import { COMPANY_ROUTES } from "@/routes/paths";

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

function formatCreatedAt(iso: string): string {
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

export function CompanyDashboardPage() {
  const [requests, setRequests] = useState<CompanyProjectRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    listCompanyProjectRequests()
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
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

  const activeRequestCount = requests.length;
  const kpis = [
    { label: "Active Requests", value: activeRequestCount, icon: TrendingUp },
    { label: "Matches Found", value: 0, icon: Target },
    { label: "Pending Responses", value: 0, icon: Clock },
    { label: "Active Collaborations", value: 0, icon: Handshake },
  ];

  const previewRequests = requests.slice(0, 4);

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="relative overflow-hidden rounded-3xl border bg-card cw-hero-bg p-8 md:p-10 mb-6">
        <div className="max-w-2xl">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 mb-4">
            <Sparkles className="h-3 w-3 mr-1" /> SkillSwap · Company Workspace
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            Welcome back — find the right{" "}
            <span className="cw-gradient-text">student or team</span> for your next project.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl">
            Create a project request and let AI surface the best matches. Review recommendations,
            reach out, and start collaborating.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="rounded-xl cw-btn-gradient">
              <Link to={COMPANY_ROUTES.newRequest}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project Request
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="cw-card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-semibold mt-2">
                {loading ? "—" : k.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="cw-card-elevated lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Active Requests</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={COMPANY_ROUTES.requests}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading requests…</p>
            ) : loadError ? (
              <EmptyBlock
                icon={FileText}
                message="Could not load your requests. Try again from the Requests page."
                action={{ label: "Go to Requests", to: COMPANY_ROUTES.requests }}
              />
            ) : previewRequests.length === 0 ? (
              <EmptyBlock
                icon={FileText}
                message="No project requests yet. Create one to start AI matching with students and teams."
                action={{ label: "Create Project Request", to: COMPANY_ROUTES.newRequest }}
              />
            ) : (
              <div className="divide-y">
                {previewRequests.map((r) => (
                  <div key={r.id} className="py-4 flex flex-wrap items-center gap-3 md:gap-4">
                    <div className="flex-1 min-w-[180px]">
                      <div className="font-medium text-sm">{r.title}</div>
                      {r.createdAt && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Created {formatCreatedAt(r.createdAt)}
                        </div>
                      )}
                    </div>
                    {r.collaborationType && (
                      <Badge variant="outline" className="rounded-md shrink-0">
                        {collaborationFormatLabel(r.collaborationType)}
                      </Badge>
                    )}
                    <Button size="sm" variant="outline" className="rounded-lg shrink-0" asChild>
                      <Link to={COMPANY_ROUTES.requestDetail(r.id)}>View details</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="cw-card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Messages
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={COMPANY_ROUTES.messages}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <EmptyBlock
              icon={MessageSquare}
              message="No messages yet. Conversations with students and teams will appear here once you reach out."
              action={{ label: "Open Messages", to: COMPANY_ROUTES.messages }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card className="cw-card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Top Student Matches</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={`${COMPANY_ROUTES.matches}?type=students`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <EmptyBlock
              icon={UserRound}
              message="No student matches to show yet. Run AI matching from a project request to see recommendations."
              action={{ label: "AI Matches", to: COMPANY_ROUTES.matches }}
            />
          </CardContent>
        </Card>

        <Card className="cw-card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Top Team Matches</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={`${COMPANY_ROUTES.matches}?type=teams`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <EmptyBlock
              icon={Users}
              message="No team matches to show yet. Create a team-oriented request to discover complete student teams."
              action={{ label: "AI Matches", to: COMPANY_ROUTES.matches }}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="cw-card-elevated mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Ongoing Collaborations</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to={COMPANY_ROUTES.collaborations}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <EmptyBlock
            icon={Handshake}
            message="No active collaborations yet. When students or teams accept your outreach, they will appear here."
            action={{ label: "Collaborations", to: COMPANY_ROUTES.collaborations }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
