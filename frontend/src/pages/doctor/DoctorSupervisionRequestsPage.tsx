import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Inbox, Loader2, XCircle } from "lucide-react";
import {
  acceptSupervisorCancelRequest,
  acceptSupervisorRequest,
  getDoctorSupervisorCancelRequests,
  getDoctorSupervisorRequests,
  rejectSupervisorCancelRequest,
  rejectSupervisorRequest,
  type DoctorSupervisorCancelRequest,
  type DoctorSupervisorRequest,
  parseApiErrorMessage,
} from "@/api/doctorDashboardApi";
import { CancellationRequestCard } from "@/components/doctor/supervision/CancellationRequestCard";
import { SupervisionRequestCard } from "@/components/doctor/supervision/SupervisionRequestCard";
import { SupervisionRequestStatCard } from "@/components/doctor/supervision/SupervisionRequestStatCard";
import { SupervisionRequestsEmptyState } from "@/components/doctor/supervision/SupervisionRequestsEmptyState";
import {
  cancelRequestTabCounts,
  filterCancelRequestsByTab,
  inboxActionKey,
  mergeDoctorRequestRows,
  type DoctorRequestInboxKind,
} from "@/lib/doctorRequestInbox";
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

type RequestListEntry =
  | { kind: "supervision"; request: DoctorSupervisorRequest }
  | { kind: "cancellation"; request: DoctorSupervisorCancelRequest };

function listEntryKey(entry: RequestListEntry): string {
  return entry.kind === "supervision"
    ? `supervision-${entry.request.requestId}`
    : `cancellation-${entry.request.requestId}`;
}

export default function DoctorSupervisionRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DoctorSupervisorRequest[]>([]);
  const [cancelRequests, setCancelRequests] = useState<DoctorSupervisorCancelRequest[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]["id"]>("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [supervisionResult, cancelResult] = await Promise.allSettled([
        getDoctorSupervisorRequests(),
        getDoctorSupervisorCancelRequests(),
      ]);

      const supervisionList =
        supervisionResult.status === "fulfilled" ? supervisionResult.value : [];
      const cancelList = cancelResult.status === "fulfilled" ? cancelResult.value : [];

      if (supervisionResult.status === "rejected" && cancelResult.status === "rejected") {
        throw supervisionResult.reason;
      }

      if (supervisionResult.status === "rejected") {
        toast({
          variant: "destructive",
          title: "Could not load supervision requests",
          description: parseApiErrorMessage(supervisionResult.reason),
        });
      }

      if (cancelResult.status === "rejected") {
        toast({
          variant: "destructive",
          title: "Could not load cancellation requests",
          description: parseApiErrorMessage(cancelResult.reason),
        });
      }

      setRequests(supervisionList);
      setCancelRequests(cancelList);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load requests",
        description: parseApiErrorMessage(err),
      });
      setRequests([]);
      setCancelRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const supervisionCounts = useMemo(() => supervisionTabCounts(requests), [requests]);
  const cancelCounts = useMemo(() => cancelRequestTabCounts(cancelRequests), [cancelRequests]);

  const summary = useMemo(
    () => ({
      pendingCount: supervisionCounts.pending + cancelCounts.pending,
      acceptedCount: supervisionCounts.accepted + cancelCounts.accepted,
      rejectedCount: supervisionCounts.rejected + cancelCounts.rejected,
      totalCount: supervisionCounts.all + cancelCounts.all,
    }),
    [supervisionCounts, cancelCounts],
  );

  const tabCounts = useMemo(
    () => ({
      all: supervisionCounts.all + cancelCounts.all,
      pending: mergeDoctorRequestRows(requests, cancelRequests).length,
      accepted: supervisionCounts.accepted + cancelCounts.accepted,
      rejected: supervisionCounts.rejected + cancelCounts.rejected,
    }),
    [requests, cancelRequests, supervisionCounts, cancelCounts],
  );

  const filteredEntries = useMemo((): RequestListEntry[] => {
    if (activeTab === "pending") {
      const merged = mergeDoctorRequestRows(requests, cancelRequests);
      const supervisionById = new Map(requests.map((r) => [r.requestId, r]));
      const cancelById = new Map(cancelRequests.map((r) => [r.requestId, r]));

      return merged.flatMap((row): RequestListEntry[] => {
        if (row.kind === "supervision") {
          const request = supervisionById.get(row.requestId);
          return request ? [{ kind: "supervision", request }] : [];
        }
        const request = cancelById.get(row.requestId);
        return request ? [{ kind: "cancellation", request }] : [];
      });
    }

    const supervisionFiltered = filterSupervisionRequestsByTab(requests, activeTab);
    const cancelFiltered = filterCancelRequestsByTab(cancelRequests, activeTab);

    return [
      ...supervisionFiltered.map(
        (request): RequestListEntry => ({ kind: "supervision", request }),
      ),
      ...cancelFiltered.map(
        (request): RequestListEntry => ({ kind: "cancellation", request }),
      ),
    ].sort((a, b) => b.request.requestId - a.request.requestId);
  }, [requests, cancelRequests, activeTab]);

  const totalVisibleCount = requests.length + cancelRequests.length;

  const tabBadge = (tabId: typeof activeTab) => {
    if (tabId === "all") return tabCounts.all;
    return tabCounts[tabId as SupervisionRequestStatus];
  };

  const runAction = async (
    kind: DoctorRequestInboxKind,
    requestId: number,
    action: "accept" | "reject",
  ) => {
    const key = inboxActionKey(kind, requestId, action);
    setBusyKey(key);
    try {
      if (kind === "supervision") {
        if (action === "accept") {
          await acceptSupervisorRequest(requestId);
          toast({
            title: "Request accepted",
            description: "The project is now in Active Projects.",
          });
        } else {
          await rejectSupervisorRequest(requestId);
          toast({ title: "Request rejected" });
        }
      } else if (action === "accept") {
        await acceptSupervisorCancelRequest(requestId);
        toast({
          title: "Cancellation request accepted",
          description: "Supervision has been removed for this project.",
        });
      } else {
        await rejectSupervisorCancelRequest(requestId);
        toast({ title: "Cancellation request rejected" });
      }
      await load();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: parseApiErrorMessage(err) });
    } finally {
      setBusyKey(null);
    }
  };

  const isEntryBusy = (entry: RequestListEntry, action: "accept" | "reject") =>
    busyKey === inboxActionKey(entry.kind, entry.request.requestId, action);

  return (
    <main className="flex-1 bg-gradient-mesh min-h-full">
      <div className="px-5 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">
        <header>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            Supervision Requests
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm lg:text-[15px] max-w-2xl">
            Review supervision and cancellation requests submitted by students for your
            graduation projects.
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

        <div className="doctor-workspace-tabs" role="tablist" aria-label="Request status">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn("doctor-tab", activeTab === t.id && "doctor-tab--active")}
            >
              {t.label}
              <span className="doctor-tab-badge">{loading ? "…" : tabBadge(t.id)}</span>
            </button>
          ))}
        </div>

        <section className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{filteredEntries.length}</span>{" "}
              of <span className="text-foreground font-semibold">{totalVisibleCount}</span> requests
            </p>
            <p className="text-xs text-muted-foreground">
              {activeTab === "pending"
                ? "Pending inbox · supervision before cancellation"
                : "Sorted by request id · newest first"}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading requests" />
            </div>
          ) : filteredEntries.length === 0 ? (
            totalVisibleCount === 0 ? (
              <SupervisionRequestsEmptyState />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center shadow-card">
                <p className="font-display font-semibold text-foreground">No requests in this tab</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try another status filter to see more supervision or cancellation requests.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) =>
                entry.kind === "supervision" ? (
                  <SupervisionRequestCard
                    key={listEntryKey(entry)}
                    request={entry.request}
                    busyRequestId={
                      isEntryBusy(entry, "accept") || isEntryBusy(entry, "reject")
                        ? entry.request.requestId
                        : null
                    }
                    onAccept={(id) => void runAction("supervision", id, "accept")}
                    onReject={(id) => void runAction("supervision", id, "reject")}
                  />
                ) : (
                  <CancellationRequestCard
                    key={listEntryKey(entry)}
                    request={entry.request}
                    busyRequestId={
                      isEntryBusy(entry, "accept") || isEntryBusy(entry, "reject")
                        ? entry.request.requestId
                        : null
                    }
                    onAccept={(id) => void runAction("cancellation", id, "accept")}
                    onReject={(id) => void runAction("cancellation", id, "reject")}
                  />
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
