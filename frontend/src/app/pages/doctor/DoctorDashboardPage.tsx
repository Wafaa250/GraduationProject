import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDashboardSummary, type DashboardSummary } from "../../../api/dashboardApi";
import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
  doctorDashboardApi,
  removeDoctorSupervision,
  type DoctorSupervisedProject,
} from "../../../api/doctorDashboardApi";
import {
  acceptSupervisorCancelRequest,
  acceptSupervisorRequest,
  getDoctorRequests,
  getDoctorSupervisorCancelRequests,
  rejectSupervisorCancelRequest,
  rejectSupervisorRequest,
  type SupervisorCancelRequestItem,
  type SupervisorRequest,
} from "../../../api/supervisorApi";
import { ToastProvider, useToast } from "../../../context/ToastContext";
import type {
  DoctorDashboardSection,
  DoctorMeResponse,
  DoctorDashboardSummary,
} from "./doctorDashboardTypes";
import { mergeDoctorRequestRows } from "./doctorRequestUtils";
import { DoctorDashboardLayout } from "./dashboard/DoctorDashboardLayout";
import { OverviewSection } from "./dashboard/OverviewSection";
import { RequestsSection } from "./dashboard/RequestsSection";
import { ProjectsSection } from "./dashboard/ProjectsSection";
import { DeletedProjectsSection } from "./dashboard/DeletedProjectsSection";
import {
  buildOverviewHighlight,
  buildOverviewHighlightFromSupervised,
  buildOverviewSuggestions,
} from "./dashboard/doctorDashboardHelpers";
import {
  appendDeletedProject,
  loadDeletedProjects,
  type DeletedProjectRecord,
} from "./doctorDeletedProjectsStorage";

function DoctorDashboardContent() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<DoctorDashboardSection>("overview");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const [me, setMe] = useState<DoctorMeResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [doctorStats, setDoctorStats] = useState<DoctorDashboardSummary | null>(null);

  const [supervisedProjects, setSupervisedProjects] = useState<DoctorSupervisedProject[]>([]);
  const [supervisedLoading, setSupervisedLoading] = useState(false);
  const [supervisedError, setSupervisedError] = useState<string | null>(null);

  const [supervisionRequests, setSupervisionRequests] = useState<SupervisorRequest[]>([]);
  const [cancelRequests, setCancelRequests] = useState<SupervisorCancelRequestItem[]>([]);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [actionKey, setActionKey] = useState<string | null>(null);
  const [removingProjectId, setRemovingProjectId] = useState<number | null>(null);

  const [deletedItems, setDeletedItems] = useState<DeletedProjectRecord[]>(() =>
    loadDeletedProjects(),
  );

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const settled = await Promise.allSettled([
        getDashboardSummary(),
        doctorDashboardApi.getSummary(),
      ]);
      const sumRes = settled[0];
      const docRes = settled[1];

      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value);
      } else {
        setSummary(null);
        setOverviewError(parseApiErrorMessage(sumRes.reason));
      }

      if (docRes.status === "fulfilled") {
        setDoctorStats(docRes.value.data);
      } else {
        setDoctorStats(null);
      }
    } catch (e) {
      setOverviewError(parseApiErrorMessage(e));
      setSummary(null);
      setDoctorStats(null);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  /** GET /api/doctors/me/supervised-projects only — doctor My Projects (not /dashboard/my-project). */
  const loadSupervisedProjects = useCallback(async () => {
    setSupervisedLoading(true);
    setSupervisedError(null);
    try {
      const { data } = await doctorDashboardApi.getProjects();
      setSupervisedProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      setSupervisedError(parseApiErrorMessage(e));
      setSupervisedProjects([]);
    } finally {
      setSupervisedLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const settled = await Promise.allSettled([
        getDoctorRequests(),
        getDoctorSupervisorCancelRequests(),
      ]);

      const supResult = settled[0];
      const canResult = settled[1];

      if (supResult.status === "rejected") {
        console.error("[DoctorDashboard] GET /doctors/me/requests failed", supResult.reason);
      }
      if (canResult.status === "rejected") {
        console.error(
          "[DoctorDashboard] GET /doctors/me/supervisor-cancel-requests failed",
          canResult.reason,
        );
      }

      setSupervisionRequests(supResult.status === "fulfilled" ? supResult.value : []);
      setCancelRequests(canResult.status === "fulfilled" ? canResult.value : []);

      const failures = settled.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      if (failures.length === 2) {
        setRequestsError(parseApiErrorMessage(failures[0].reason));
      } else if (failures.length === 1) {
        setRequestsError(
          `Could not load all requests (${parseApiErrorMessage(failures[0].reason)}). The other list may still appear below.`,
        );
      }
    } catch (err: unknown) {
      setRequestsError(parseApiErrorMessage(err));
      setSupervisionRequests([]);
      setCancelRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  /** After any request/supervision change: sync inbox + supervised list + overview stats. */
  const refetchAll = useCallback(async () => {
    await Promise.all([loadRequests(), loadSupervisedProjects(), loadOverview()]);
  }, [loadRequests, loadSupervisedProjects, loadOverview]);

  /** Refresh deleted list from localStorage when opening the section (e.g. after remove on another tab). */
  useEffect(() => {
    if (activeSection === "deleted") {
      setDeletedItems(loadDeletedProjects());
    }
  }, [activeSection]);

  /** Cross-tab localStorage updates + same-tab custom sync after appendDeletedProject */
  useEffect(() => {
    const syncDeletedFromStorage = () => setDeletedItems(loadDeletedProjects());
    window.addEventListener("storage", syncDeletedFromStorage);
    window.addEventListener("doctor-dashboard-deleted-sync", syncDeletedFromStorage);
    return () => {
      window.removeEventListener("storage", syncDeletedFromStorage);
      window.removeEventListener("doctor-dashboard-deleted-sync", syncDeletedFromStorage);
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      setPageLoading(true);
      setPageError(null);
      try {
        const { data } = await api.get<DoctorMeResponse>("/me");
        if (data.role !== "doctor" || data.profileId == null) {
          setPageError("This account is not a doctor profile.");
          setMe(null);
          return;
        }
        setMe(data);
        await Promise.all([loadOverview(), loadSupervisedProjects(), loadRequests()]);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          setPageError("Your session expired. Sign in again.");
          setMe(null);
          return;
        }
        setPageError(parseApiErrorMessage(err) || "Could not load your account.");
        setMe(null);
      } finally {
        setPageLoading(false);
      }
    };
    void run();
  }, [loadOverview, loadSupervisedProjects, loadRequests]);

  const mergedRows = useMemo(
    () => mergeDoctorRequestRows(supervisionRequests, cancelRequests),
    [supervisionRequests, cancelRequests],
  );

  const highlight = useMemo(() => {
    return (
      buildOverviewHighlight(summary, null) ??
      buildOverviewHighlightFromSupervised(supervisedProjects)
    );
  }, [summary, supervisedProjects]);

  const suggestions = useMemo(() => buildOverviewSuggestions(summary), [summary]);

  const initials = useMemo(() => {
    const n = me?.name?.trim();
    if (!n) return "DR";
    return n
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [me?.name]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleRemoveSupervision = async (project: DoctorSupervisedProject) => {
    const projectId = project.projectId;
    setRemovingProjectId(projectId);
    try {
      await removeDoctorSupervision(projectId);
      setSupervisedProjects((prev) => prev.filter((p) => p.projectId !== projectId));
      appendDeletedProject({
        projectId,
        name: project.name,
        removedAt: new Date().toISOString(),
        source: "remove",
      });
      setDeletedItems(loadDeletedProjects());
      window.dispatchEvent(new Event("doctor-dashboard-deleted-sync"));
      window.setTimeout(() => {
        void refetchAll();
      }, 300);
      showToast("Supervision removed", "success");
    } catch (e) {
      showToast(parseApiErrorMessage(e), "error");
    } finally {
      setRemovingProjectId(null);
    }
  };

  const handleSupervisionAction = async (
    requestId: number,
    action: "accept" | "reject",
  ) => {
    const key = `sup-${requestId}-${action}`;
    setActionKey(key);
    try {
      if (action === "accept") await acceptSupervisorRequest(requestId);
      else await rejectSupervisorRequest(requestId);
      setSupervisionRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      await refetchAll();
      if (action === "accept") showToast("Request accepted", "success");
      else showToast("Request rejected", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(typeof msg === "string" ? msg : parseApiErrorMessage(err), "error");
    } finally {
      setActionKey(null);
    }
  };

  const handleCancelAction = async (requestId: number, action: "accept" | "reject") => {
    const key = `can-${requestId}-${action}`;
    setActionKey(key);
    try {
      if (action === "accept") await acceptSupervisorCancelRequest(requestId);
      else await rejectSupervisorCancelRequest(requestId);
      setCancelRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      await refetchAll();
      showToast(
        action === "accept" ? "Cancellation request accepted" : "Cancellation request rejected",
        "success",
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(typeof msg === "string" ? msg : parseApiErrorMessage(err), "error");
    } finally {
      setActionKey(null);
    }
  };

  if (pageLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Loading…</p>
      </div>
    );
  }

  if (pageError || !me) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: 24,
            borderRadius: 16,
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "#b91c1c", fontWeight: 600 }}>
            {pageError || "Unable to load dashboard."}
          </p>
          <Link
            to="/login"
            style={{
              display: "inline-block",
              marginTop: 16,
              fontSize: 14,
              fontWeight: 700,
              color: "#4f46e5",
            }}
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const statsForOverview =
    doctorStats != null
      ? {
          pendingRequestsCount: doctorStats.pendingRequestsCount,
          supervisedCount: doctorStats.supervisedCount,
        }
      : null;

  return (
    <DoctorDashboardLayout
      doctorName={me.name}
      initials={initials}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      sidebarMobileOpen={sidebarMobileOpen}
      onSidebarOpen={() => setSidebarMobileOpen(true)}
      onSidebarClose={() => setSidebarMobileOpen(false)}
      onLogout={handleLogout}
    >
      {activeSection === "overview" ? (
        <OverviewSection
          me={me}
          summary={summary}
          doctorStats={statsForOverview}
          loading={overviewLoading}
          error={overviewError}
          highlight={highlight}
          suggestions={suggestions}
        />
      ) : null}

      {activeSection === "requests" ? (
        <RequestsSection
          rows={mergedRows}
          loading={requestsLoading}
          error={requestsError}
          actionKey={actionKey}
          onSupervisionAction={handleSupervisionAction}
          onCancelAction={handleCancelAction}
        />
      ) : null}

      {activeSection === "projects" ? (
        <ProjectsSection
          projects={supervisedProjects}
          loading={supervisedLoading}
          error={supervisedError}
          removingProjectId={removingProjectId}
          onCancelSupervision={(p) => void handleRemoveSupervision(p)}
        />
      ) : null}

      {activeSection === "deleted" ? <DeletedProjectsSection items={deletedItems} /> : null}
    </DoctorDashboardLayout>
  );
}

export default function DoctorDashboardPage() {
  return (
    <ToastProvider>
      <DoctorDashboardContent />
    </ToastProvider>
  );
}
