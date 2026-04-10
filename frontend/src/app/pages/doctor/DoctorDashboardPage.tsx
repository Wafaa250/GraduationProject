import React, { useCallback, useEffect, useMemo, useState } from "react";
import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import LoginPage from "../auth/LoginPage";
import {
  doctorDashboardApi,
  doctorShouldHideApiError,
  getDoctorSupervisedProjects,
} from "../../../api/doctorDashboardApi";
import {
  getDoctorRequests,
  acceptSupervisorRequest,
  rejectSupervisorRequest,
  type SupervisorRequest,
} from "../../../api/supervisorApi";
import { ToastProvider, useToast } from "../../../context/ToastContext";
import type {
  DoctorDashboardSection,
  DoctorMeResponse,
  DoctorSupervisedProject,
  RequestRow,
} from "./doctorDashboardTypes";
import { isPendingRequestStatus } from "./doctorRequestUtils";
import {
  appendDeletedProject,
  loadDeletedProjects,
  type DeletedProjectRecord,
} from "./doctorDeletedProjectsStorage";
import { DoctorDashboardLayout } from "./dashboard/DoctorDashboardLayout";
import { OverviewSection } from "./dashboard/OverviewSection";
import { RequestsSection } from "./dashboard/RequestsSection";
import { ProjectsSection } from "./dashboard/ProjectsSection";
import { DeletedProjectsSection } from "./dashboard/DeletedProjectsSection";
import {
  buildOverviewHighlightFromSupervised,
  buildSupervisedStudentRows,
} from "./dashboard/doctorDashboardHelpers";

function DoctorDashboardInner() {
  const { showToast } = useToast();
  const { isAuthenticated, logout, syncAuthFromStorage } = useAuth();

  const [activeSection, setActiveSection] = useState<DoctorDashboardSection>("overview");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const [me, setMe] = useState<DoctorMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [supervisionRequests, setSupervisionRequests] = useState<SupervisorRequest[]>([]);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [supervisedProjects, setSupervisedProjects] = useState<DoctorSupervisedProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [deletedProjects, setDeletedProjects] = useState<DeletedProjectRecord[]>(() =>
    loadDeletedProjects(),
  );
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const refetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const list = await getDoctorRequests();
      setSupervisionRequests(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      console.error("[DoctorDashboard] GET /doctors/me/requests failed", err);
      if (doctorShouldHideApiError(err)) {
        setRequestsError(null);
        setSupervisionRequests([]);
      } else {
        setRequestsError(parseApiErrorMessage(err));
        setSupervisionRequests([]);
      }
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const refetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const list = await getDoctorSupervisedProjects();
      setSupervisedProjects(list);
    } catch (err: unknown) {
      console.error("[DoctorDashboard] GET /doctors/me/supervised-projects failed", err);
      if (doctorShouldHideApiError(err)) {
        setProjectsError(null);
        setSupervisedProjects([]);
      } else {
        setProjectsError(parseApiErrorMessage(err));
        setSupervisedProjects([]);
      }
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const refetchAfterAction = useCallback(async () => {
    await Promise.all([refetchRequests(), refetchProjects()]);
  }, [refetchRequests, refetchProjects]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setMe(null);
      setLoadError(null);
      return;
    }

    const run = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data } = await api.get<DoctorMeResponse>("/me");
        if (data.role !== "doctor" || data.profileId == null) {
          setLoadError("Access restricted. This workspace is for doctor accounts only.");
          setMe(null);
          return;
        }
        setMe(data);
        await Promise.all([refetchRequests(), refetchProjects()]);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          logout();
          return;
        }
        setLoadError("Could not load your account.");
        setMe(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [isAuthenticated, logout, refetchRequests, refetchProjects]);

  const requestRows: RequestRow[] = useMemo(
    () =>
      supervisionRequests.map((r) => ({
        kind: "supervision" as const,
        requestId: r.requestId,
        projectName: r.project?.name ?? "",
        studentName: r.sender?.name ?? "",
        status: r.status,
      })),
    [supervisionRequests],
  );

  const pendingRequestsCount = useMemo(
    () => requestRows.filter((r) => isPendingRequestStatus(r.status)).length,
    [requestRows],
  );

  const overviewHighlight = useMemo(
    () => buildOverviewHighlightFromSupervised(supervisedProjects),
    [supervisedProjects],
  );

  const supervisedStudentRows = useMemo(
    () => buildSupervisedStudentRows(supervisedProjects),
    [supervisedProjects],
  );

  const overviewLoading = requestsLoading || projectsLoading;
  const overviewError = [requestsError, projectsError].filter(Boolean).join(" · ") || null;

  const handleSupervisionAction = async (requestId: number, action: "accept" | "reject") => {
    const key = `sup-${requestId}-${action}`;
    setActionKey(key);
    try {
      if (action === "accept") await acceptSupervisorRequest(requestId);
      else await rejectSupervisorRequest(requestId);
      await refetchAfterAction();
      showToast(action === "accept" ? "Request accepted" : "Request rejected", "success");
    } catch (err: unknown) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setActionKey(null);
    }
  };

  const handleRemoveProject = async (p: DoctorSupervisedProject) => {
    setRemovingId(p.projectId);
    try {
      await doctorDashboardApi.removeSupervision(p.projectId);
      showToast("Supervision removed", "success");
      const next = appendDeletedProject({
        projectId: p.projectId,
        name: p.name,
        removedAt: new Date().toISOString(),
      });
      setDeletedProjects(next);
      await refetchAfterAction();
    } catch (err: unknown) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setRemovingId(null);
    }
  };

  const initials = useMemo(() => {
    if (!me?.name) return "DR";
    return me.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [me?.name]);

  if (!isAuthenticated) {
    return <LoginPage embedded onLoginSuccess={syncAuthFromStorage} />;
  }

  if (loading) {
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
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Loading…</p>
      </div>
    );
  }

  if (loadError || !me) {
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
            width: "100%",
            padding: 24,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
          }}
        >
          <p style={{ margin: 0, fontSize: 15, color: "#b91c1c", fontWeight: 700 }}>
            {loadError || "Unable to load dashboard."}
          </p>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              marginTop: 16,
              padding: "10px 18px",
              background: "linear-gradient(135deg,#4f46e5,#9333ea)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <DoctorDashboardLayout
      doctorName={me.name}
      initials={initials}
      onLogout={logout}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      sidebarMobileOpen={sidebarMobileOpen}
      onSidebarToggle={() => setSidebarMobileOpen((o) => !o)}
      onSidebarCloseMobile={() => setSidebarMobileOpen(false)}
    >
      <div key={activeSection} className="doctor-dash-section-fade">
        {activeSection === "overview" ? (
          <OverviewSection
            me={me}
            loading={overviewLoading}
            error={overviewError}
            supervisedCount={supervisedProjects.length}
            highlight={overviewHighlight}
            supervisedStudents={supervisedStudentRows}
            pendingRequestsCount={pendingRequestsCount}
            totalRequestsCount={requestRows.length}
          />
        ) : null}

        {activeSection === "requests" ? (
          <RequestsSection
            rows={requestRows}
            loading={requestsLoading}
            error={requestsError}
            actionKey={actionKey}
            onSupervisionAction={(id, a) => void handleSupervisionAction(id, a)}
          />
        ) : null}

        {activeSection === "projects" ? (
          <ProjectsSection
            loading={projectsLoading}
            error={projectsError}
            projects={supervisedProjects}
            removingId={removingId}
            onRemoveSupervision={(p) => void handleRemoveProject(p)}
          />
        ) : null}

        {activeSection === "deleted" ? <DeletedProjectsSection items={deletedProjects} /> : null}
      </div>
    </DoctorDashboardLayout>
  );
}

export default function DoctorDashboardPage() {
  return (
    <ToastProvider>
      <DoctorDashboardInner />
    </ToastProvider>
  );
}
