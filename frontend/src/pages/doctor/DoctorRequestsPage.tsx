import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  acceptSupervisorRequest,
  rejectSupervisorRequest,
  getDoctorSupervisorRequests,
  getDoctorSupervisorCancelRequests,
  acceptSupervisorCancelRequest,
  rejectSupervisorCancelRequest,
  type DoctorSupervisorRequest,
  type DoctorSupervisorCancelRequest,
  parseApiErrorMessage,
} from "@/api/doctorDashboardApi";
import { mapSupervisorRequestToCard } from "@/lib/doctorHubMappers";
import { RequestCard } from "@/components/doctor/hub/RequestCard";
import { RequestDetailDialog } from "@/components/doctor/hub/RequestDetailDialog";
import { DoctorHubSectionEmpty } from "@/components/doctor/hub/DoctorHubSectionEmpty";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { toast } from "@/hooks/use-toast";

export default function DoctorRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DoctorSupervisorRequest[]>([]);
  const [cancelRequests, setCancelRequests] = useState<DoctorSupervisorCancelRequest[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [req, cancel] = await Promise.all([
        getDoctorSupervisorRequests(),
        getDoctorSupervisorCancelRequests(),
      ]);
      setRequests(req);
      setCancelRequests(cancel);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load requests",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const detailRequest = useMemo(
    () => requests.find((r) => r.requestId === detailId) ?? null,
    [requests, detailId],
  );

  const handleAccept = async (id: number) => {
    setBusyId(id);
    try {
      await acceptSupervisorRequest(id);
      toast({ title: "Request accepted" });
      await load();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: parseApiErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    setBusyId(id);
    try {
      await rejectSupervisorRequest(id);
      toast({ title: "Request rejected" });
      await load();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: parseApiErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const pendingCancel = cancelRequests.filter((c) => c.status === "pending");

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-[1200px] mx-auto space-y-8">
        <DoctorHubPageHeader
          title="Supervision Requests"
          description="Review incoming proposals and supervision cancellations"
        />
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {pendingCancel.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Cancellation requests
                </h2>
                <div className="space-y-2">
                  {pendingCancel.map((c) => (
                    <div
                      key={c.requestId}
                      className="rounded-xl border border-border bg-white p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{c.projectName}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.studentName} · {c.status}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-danger/30 text-danger px-3 py-1.5 text-sm font-semibold hover:bg-danger/10"
                          disabled={busyId === c.requestId}
                          onClick={() => {
                            setBusyId(c.requestId);
                            void rejectSupervisorCancelRequest(c.requestId)
                              .then(() => load())
                              .finally(() => setBusyId(null));
                          }}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold"
                          disabled={busyId === c.requestId}
                          onClick={() => {
                            setBusyId(c.requestId);
                            void acceptSupervisorCancelRequest(c.requestId)
                              .then(() => {
                                toast({ title: "Cancellation accepted" });
                                return load();
                              })
                              .finally(() => setBusyId(null));
                          }}
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold text-foreground">
                Supervision proposals
              </h2>
              {requests.length === 0 ? (
                <DoctorHubSectionEmpty message="No supervision requests yet." />
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => {
                    const card = mapSupervisorRequestToCard(r);
                    return (
                      <RequestCard
                        key={card.id}
                        r={card}
                        busyRequestId={busyId}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        onDetails={setDetailId}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <RequestDetailDialog
        request={detailRequest}
        open={detailId != null}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </main>
  );
}
