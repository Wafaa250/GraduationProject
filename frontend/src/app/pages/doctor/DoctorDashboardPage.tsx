import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import LoginPage from "../auth/LoginPage";
import { doctorDashboardApi, getDoctorSupervisedProjects } from "../../../api/doctorDashboardApi";
import { doctorDashboardKeys, supervisedProjectsQueryKey } from "../../../api/doctorDashboardQueryKeys";
import { getDashboardSummary, getDashboardMyProject, type DashboardSummary } from "../../../api/dashboardApi";
import {
  getDoctorRequests,
  acceptSupervisorRequest,
  rejectSupervisorRequest,
  type SupervisorRequest,
} from "../../../api/supervisorApi";
import { ToastProvider, useToast } from "../../../context/ToastContext";
import type { DoctorDashboardSection, DoctorMeResponse, DoctorSupervisedProject } from "./doctorDashboardTypes";
import { isPendingRequestStatus } from "./doctorRequestUtils";
import { buildOverviewHighlight, buildOverviewSuggestions } from "./dashboard/doctorDashboardHelpers";
import { DoctorDashboardLayout } from "./dashboard/DoctorDashboardLayout";
import { OverviewSection } from "./dashboard/OverviewSection";
import { RequestsSection } from "./dashboard/RequestsSection";
import { ProjectsSection } from "./dashboard/ProjectsSection";
import { DeletedProjectsSection } from "./dashboard/DeletedProjectsSection";
import {
  appendDeletedProject,
  loadDeletedProjects,
  type DeletedProjectRecord,
} from "./doctorDeletedProjectsStorage";

function DoctorDashboardInner() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isAuthenticated, logout, syncAuthFromStorage } = useAuth();

  const [activeSection, setActiveSection] = useState<DoctorDashboardSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [me, setMe] = useState<DoctorMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [deletedProjects, setDeletedProjects] = useState<DeletedProjectRecord[]>(() =>
    loadDeletedProjects(),
  );
  const [removingId, setRemovingId] = useState<number | null>(null);

  const doctorSessionOk = Boolean(
    isAuthenticated && me && me.role === "doctor" && me.profileId != null && !loadError,
  );

  const requestsQuery = useQuery({
    queryKey: doctorDashboardKeys.requests,
    queryFn: getDoctorRequests,
    enabled: doctorSessionOk,
  });

  const summaryQuery = useQuery({
    queryKey: doctorDashboardKeys.dashboardSummary,
    queryFn: getDashboardSummary,
    enabled: doctorSessionOk,
  });

  const myProjectQuery = useQuery({
    queryKey: doctorDashboardKeys.dashboardMyProject,
    queryFn: getDashboardMyProject,
    enabled: doctorSessionOk,
  });

  const supervisedProjectsQuery = useQuery({
    queryKey: supervisedProjectsQueryKey,
    queryFn: getDoctorSupervisedProjects,
    enabled: doctorSessionOk,
  });

  const requestActionMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: "accept" | "reject" }) => {
      if (action === "accept") await acceptSupervisorRequest(requestId);
      else await rejectSupervisorRequest(requestId);
    },
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: doctorDashboardKeys.requests });
      const previous = queryClient.getQueryData<SupervisorRequest[]>(doctorDashboardKeys.requests);
      queryClient.setQueryData<SupervisorRequest[]>(doctorDashboardKeys.requests, (old) =>
        (old ?? []).filter((r) => r.requestId !== requestId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(doctorDashboardKeys.requests, context.previous);
      }
    },
    onSuccess: async (_data, variables) => {
      if (variables.action === "accept") {
        await queryClient.refetchQueries({ queryKey: supervisedProjectsQueryKey });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: doctorDashboardKeys.requests });
      await queryClient.invalidateQueries({ queryKey: doctorDashboardKeys.dashboardMyProject });
      await queryClient.invalidateQueries({ queryKey: doctorDashboardKeys.dashboardSummary });
    },
  });

  const supervisionRequests = requestsQuery.data ?? [];
  const requestsError = requestsQuery.error ? parseApiErrorMessage(requestsQuery.error) : null;
  const requestsLoading = requestsQuery.isLoading || requestsQuery.isFetching;

  const summary: DashboardSummary | null = summaryQuery.data ?? null;
  const overviewError = summaryQuery.error ? parseApiErrorMessage(summaryQuery.error) : null;
  const overviewLoading = summaryQuery.isLoading || summaryQuery.isFetching;

  const myProject = myProjectQuery.data ?? null;
  const supervisedProjects = supervisedProjectsQuery.data ?? [];
  const projectsError = supervisedProjectsQuery.error
    ? parseApiErrorMessage(supervisedProjectsQuery.error)
    : null;
  const projectsLoading = supervisedProjectsQuery.isLoading || supervisedProjectsQuery.isFetching;

  const actionKey =
    requestActionMutation.isPending && requestActionMutation.variables
      ? `sup-${requestActionMutation.variables.requestId}-${requestActionMutation.variables.action}`
      : null;

  const invalidateDoctorDashboard = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: doctorDashboardKeys.requests });
    await queryClient.invalidateQueries({ queryKey: doctorDashboardKeys.dashboardMyProject });
    await queryClient.invalidateQueries({ queryKey: doctorDashboardKeys.dashboardSummary });
    await queryClient.invalidateQueries({ queryKey: supervisedProjectsQueryKey });
  }, [queryClient]);

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
          setLoadError("Access restricted. This account is not a doctor profile.");
          setMe(null);
          return;
        }
        setMe(data);
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
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated || activeSection !== "requests") return;
    void queryClient.invalidateQueries({ queryKey: doctorDashboardKeys.requests });
  }, [activeSection, isAuthenticated, queryClient]);

  useEffect(() => {
    const s = (location.state as { defaultSection?: DoctorDashboardSection } | null)?.defaultSection;
    if (s === "overview" || s === "requests" || s === "projects" || s === "deleted") {
      setActiveSection(s);
    }
  }, [location.state]);

  useEffect(() => {
    setDeletedProjects(loadDeletedProjects());
  }, [location.key]);

  useEffect(() => {
    if (activeSection === "deleted") {
      setDeletedProjects(loadDeletedProjects());
    }
  }, [activeSection]);

  const pendingRequestsCount = useMemo(
    () => supervisionRequests.filter((r) => isPendingRequestStatus(r.status)).length,
    [supervisionRequests],
  );

  const overviewHighlight = useMemo(
    () => buildOverviewHighlight(summary, myProject),
    [summary, myProject],
  );

  const suggestions = useMemo(() => buildOverviewSuggestions(summary), [summary]);

  const handleRequestAction = (requestId: number, action: "accept" | "reject") => {
    requestActionMutation.mutate(
      { requestId, action },
      {
        onSuccess: () => {
          showToast(action === "accept" ? "Request accepted" : "Request rejected", "success");
        },
        onError: (err: unknown) => {
          showToast(parseApiErrorMessage(err), "error");
        },
      },
    );
  };

  const handleRemoveSupervision = async (p: DoctorSupervisedProject) => {
    setRemovingId(p.projectId);
    try {
      await doctorDashboardApi.removeSupervision(p.projectId);
      showToast("Doctor cancelled the project", "success");
      const next = appendDeletedProject({
        projectId: p.projectId,
        name: p.name,
        removedAt: new Date().toISOString(),
        source: "remove_supervision",
      });
      setDeletedProjects(next);
      await invalidateDoctorDashboard();
    } catch (err: unknown) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setRemovingId(null);
    }
  };

  const initials =
    me?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "DR";

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
        <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Loading…</p>
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
            maxWidth: 480,
            width: "100%",
            background: "#fff",
            borderRadius: 16,
            padding: 28,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 24px rgba(15,23,42,0.06)",
          }}
        >
          <p style={{ margin: 0, fontSize: 15, color: "#b91c1c", fontWeight: 700 }}>
            {loadError || "Unable to load dashboard."}
          </p>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              marginTop: 18,
              padding: "10px 18px",
              background: "linear-gradient(135deg,#6366f1,#a855f7)",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
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
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      sidebarMobileOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      onLogout={logout}
    >
      {activeSection === "overview" ? (
        <OverviewSection
          me={me}
          summary={summary}
          loading={overviewLoading}
          error={overviewError}
          highlight={overviewHighlight}
          suggestions={suggestions}
          pendingRequestsCount={pendingRequestsCount}
        />
      ) : null}

      {activeSection === "requests" ? (
        <RequestsSection
          requests={supervisionRequests}
          loading={requestsLoading}
          error={requestsError}
          actionKey={actionKey}
          onAction={(id, a) => handleRequestAction(id, a)}
        />
      ) : null}

      {activeSection === "projects" ? (
        <ProjectsSection
          projects={supervisedProjects}
          loading={projectsLoading}
          error={projectsError}
          removingId={removingId}
          onRemoveSupervision={(p) => void handleRemoveSupervision(p)}
        />
      ) : null}

      {activeSection === "deleted" ? <DeletedProjectsSection items={deletedProjects} /> : null}
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
