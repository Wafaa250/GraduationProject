import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Inbox, Loader2, XCircle } from "lucide-react";
import {
  acceptSupervisorRequest,
  getDoctorSupervisorRequests,
  getDoctorSupervisorRequestsSummary,
  rejectSupervisorRequest,
  type DoctorSupervisorRequest,
  type DoctorSupervisorRequestsSummary,
  parseApiErrorMessage,
} from "@/api/doctorDashboardApi";
import { SupervisionRequestCard } from "@/components/doctor/supervision/SupervisionRequestCard";
import { SupervisionRequestDetailSheet } from "@/components/doctor/supervision/SupervisionRequestDetailSheet";
import { SupervisionRequestStatCard } from "@/components/doctor/supervision/SupervisionRequestStatCard";
import { SupervisionRequestsEmptyState } from "@/components/doctor/supervision/SupervisionRequestsEmptyState";
import {
  filterSupervisionRequestsByTab,
  supervisionTabCounts,
  type SupervisionRequestStatus,
} from "@/lib/supervisionRequestUi";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const STATUS_TABS = [
  { id: "all" as const, label: "All" },
  { id: "pending" as const, label: "Pending" },
  { id: "accepted" as const, label: "Accepted" },
  { id: "rejected" as const, label: "Rejected" },
];

const EMPTY_SUMMARY: DoctorSupervisorRequestsSummary = {
  pendingCount: 0,
  acceptedCount: 0,
  rejectedCount: 0,
  totalCount: 0,
};

export default function DoctorSupervisionRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DoctorSupervisorRequest[]>([]);
  const [summary, setSummary] = useState<DoctorSupervisorRequestsSummary>(EMPTY_SUMMARY);
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]["id"]>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detailRequest, setDetailRequest] = useState<DoctorSupervisorRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, counts] = await Promise.all([
        getDoctorSupervisorRequests(),
        getDoctorSupervisorRequestsSummary(),
      ]);
      setRequests(list);
      setSummary(counts);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load supervision requests",
        description: parseApiErrorMessage(err),
      });
      setRequests([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tabCounts = useMemo(() => supervisionTabCounts(requests), [requests]);

  const filtered = useMemo(
    () => filterSupervisionRequestsByTab(requests, activeTab),
    [requests, activeTab],
  );

  const tabBadge = (tabId: typeof activeTab) => {
    if (tabId === "all") return tabCounts.all;
    return tabCounts[tabId as SupervisionRequestStatus];
  };

  const handleAccept = async (id: number, feedback: string) => {
    setBusyId(id);
    try {
      await acceptSupervisorRequest(id, feedback);
      toast({ title: "Request accepted" });
      setDetailRequest(null);
      await load();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: parseApiErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number, feedback: string) => {
    setBusyId(id);
    try {
      await rejectSupervisorRequest(id, feedback);
      toast({ title: "Request rejected" });
      setDetailRequest(null);
      await load();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: parseApiErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="flex-1 bg-gradient-mesh min-h-full">
      <div className="px-5 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">
        <header>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            Supervision Requests
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm lg:text-[15px] max-w-2xl">
            Review and manage graduation project supervision requests submitted by students.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SupervisionRequestStatCard
            label="Pending Requests"
            value={summary.pendingCount}
            icon={Clock}
            accent="warning"
            loading={loading}
          />
          <SupervisionRequestStatCard
            label="Accepted Requests"
            value={summary.acceptedCount}
            icon={CheckCircle2}
            accent="success"
            loading={loading}
          />
          <SupervisionRequestStatCard
            label="Rejected Requests"
            value={summary.rejectedCount}
            icon={XCircle}
            accent="destructive"
            loading={loading}
          />
          <SupervisionRequestStatCard
            label="Total Requests"
            value={summary.totalCount}
            icon={Inbox}
            accent="primary"
            loading={loading}
          />
        </div>

        <div
          className="inline-flex items-center gap-1 bg-secondary/60 rounded-lg p-1 flex-wrap"
          role="tablist"
          aria-label="Request status"
        >
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "h-8 px-3 rounded-md text-sm font-medium transition-smooth inline-flex items-center gap-2",
                activeTab === t.id
                  ? "bg-white text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "text-[11px] px-1.5 py-0.5 rounded-md font-semibold",
                  activeTab === t.id
                    ? "bg-primary/10 text-primary"
                    : "bg-white/60 text-muted-foreground",
                )}
              >
                {loading ? "…" : tabBadge(t.id)}
              </span>
            </button>
          ))}
        </div>

        <section className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{filtered.length}</span> of{" "}
              <span className="text-foreground font-semibold">{requests.length}</span> requests
            </p>
            <p className="text-xs text-muted-foreground">
              Sorted by submission date · newest first
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading requests" />
            </div>
          ) : filtered.length === 0 ? (
            requests.length === 0 ? (
              <SupervisionRequestsEmptyState />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-white py-12 text-center shadow-card">
                <p className="font-display font-semibold text-foreground">
                  No requests in this tab
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try another status filter to see more supervision requests.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {filtered.map((r) => (
                <SupervisionRequestCard
                  key={r.requestId}
                  request={r}
                  busyRequestId={busyId}
                  onView={setDetailRequest}
                  onAccept={(id) => void handleAccept(id, "")}
                  onReject={(id) => void handleReject(id, "")}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <SupervisionRequestDetailSheet
        request={detailRequest}
        open={detailRequest != null}
        busy={busyId != null}
        onOpenChange={(open) => !open && setDetailRequest(null)}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </main>
  );
}
