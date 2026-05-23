import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    DoctorUiTestCourse,
} from "./doctorDashboardTypes";
import { isPendingRequestStatus, mergeDoctorRequestRows } from "./doctorRequestUtils";
import { dash, glassCard } from "./dashboard/doctorDashTokens";
import "./dashboard/doctor-dashboard.css";
import { DoctorDashboardLayout } from "./dashboard/DoctorDashboardLayout";
import {
  parseSectionFromSearch,
  sectionToSearchParam,
} from "../../components/doctor/hub/doctorHubNav";
import { OverviewSection } from "./dashboard/OverviewSection";
import { RequestsSection } from "./dashboard/RequestsSection";
import { ProjectsSection } from "./dashboard/ProjectsSection";
import { DeletedProjectsSection } from "./dashboard/DeletedProjectsSection";
import { DoctorCoursesSection } from "./dashboard/DoctorCoursesSection";
import { formatDepartmentLine } from "./dashboard/doctorDisplayCopy";
import {
    normalizeDoctorDashboardSummary,
    normalizeDoctorMe,
    normalizeSupervisedProjectsList,
} from "./dashboard/doctorDashboardApiMappers";
import {
    appendDeletedProject,
    loadDeletedProjects,
    type DeletedProjectRecord,
} from "./doctorDeletedProjectsStorage";

const DOCTOR_UI_COURSES_KEY = "doctor-ui-courses-v1";

function readPersistedUiCourses(): DoctorUiTestCourse[] {
    try {
        const raw = sessionStorage.getItem(DOCTOR_UI_COURSES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (c): c is DoctorUiTestCourse =>
                c != null &&
                typeof c === "object" &&
                typeof (c as DoctorUiTestCourse).id === "string" &&
                typeof (c as DoctorUiTestCourse).name === "string" &&
                typeof (c as DoctorUiTestCourse).code === "string",
        );
    } catch {
        return [];
    }
}

function initialSectionFromSearch(search: string): DoctorDashboardSection {
    return parseSectionFromSearch(search) ?? "overview";
}

function DoctorDashboardContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [activeSection, setActiveSection] = useState<DoctorDashboardSection>(() =>
        initialSectionFromSearch(location.search),
    );
    useEffect(() => {
        const parsed = parseSectionFromSearch(location.search);
        if (parsed) setActiveSection(parsed);
    }, [location.search]);

    const handleSectionChange = useCallback(
        (section: DoctorDashboardSection) => {
            setActiveSection(section);
            const params = new URLSearchParams(location.search);
            params.set("section", sectionToSearchParam(section));
            params.delete("tab");
            navigate(
                { pathname: "/doctor-dashboard", search: params.toString() ? `?${params.toString()}` : "" },
                { replace: true },
            );
        },
        [location.search, navigate],
    );

    const [me, setMe] = useState<DoctorMeResponse | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);

    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
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

    // uiCourses was a local-only testing layer; now that CreateCourse calls the
    // real API, all courses come from getDoctorMyCourses(). We clear the stale
    // sessionStorage key so old temp entries don't bleed through after upgrading.
    useEffect(() => {
        try { sessionStorage.removeItem(DOCTOR_UI_COURSES_KEY); } catch { /* ignore */ }
    }, []);

    const uiCourses: DoctorUiTestCourse[] = [];

    /** GET /api/doctors/me/dashboard-summary */
    const loadDoctorStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const { data } = await doctorDashboardApi.getSummary();
            setDoctorStats(normalizeDoctorDashboardSummary(data));
        } catch (e) {
            setStatsError(parseApiErrorMessage(e));
            setDoctorStats(null);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    /** GET /api/doctors/me/supervised-projects only — doctor My Projects (not /dashboard/my-project). */
    const loadSupervisedProjects = useCallback(async () => {
        setSupervisedLoading(true);
        setSupervisedError(null);
        try {
            const { data } = await doctorDashboardApi.getProjects();
            setSupervisedProjects(normalizeSupervisedProjectsList(data));
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
        await Promise.all([loadRequests(), loadSupervisedProjects(), loadDoctorStats()]);
    }, [loadRequests, loadSupervisedProjects, loadDoctorStats]);

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
                const { data } = await api.get("/me");
                const doctorMe = normalizeDoctorMe(data);
                if (!doctorMe) {
                    setPageError("This account is not a doctor profile.");
                    setMe(null);
                    return;
                }
                setMe(doctorMe);
                await Promise.all([loadDoctorStats(), loadSupervisedProjects(), loadRequests()]);
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
    }, [loadDoctorStats, loadSupervisedProjects, loadRequests]);

    useEffect(() => {
        if (activeSection === "recommendations") {
            setActiveSection("overview");
        }
    }, [activeSection]);

    const mergedRows = useMemo(
        () => mergeDoctorRequestRows(supervisionRequests, cancelRequests),
        [supervisionRequests, cancelRequests],
    );

    const initials = useMemo(() => {
        const n = (me?.name ?? "").trim();
        if (!n) return "DR";
        return n
            .split(/\s+/)
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }, [me?.name]);

    const statsForOverview =
        doctorStats != null
            ? {
                pendingRequestsCount: doctorStats.pendingRequestsCount,
                supervisedCount: doctorStats.supervisedCount,
                pendingCancelCount: doctorStats.pendingCancelCount,
            }
            : null;

    const pendingPreview = useMemo(
        () => mergedRows.filter((r) => isPendingRequestStatus(r.status)).slice(0, 3),
        [mergedRows],
    );

    const pendingForActivity = useMemo(
        () => mergedRows.filter((r) => isPendingRequestStatus(r.status)),
        [mergedRows],
    );

    const doctorSubtitle = useMemo(
        () => formatDepartmentLine(me?.specialization, me?.department, me?.faculty),
        [me?.specialization, me?.department, me?.faculty],
    );

    const navCounts = useMemo(
        () => ({
            pendingRequests: mergedRows.filter((r) => isPendingRequestStatus(r.status)).length,
        }),
        [mergedRows],
    );

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
                className="dd-root"
                style={{
                    minHeight: "100vh",
                    background: dash.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: dash.font,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div className="dd-blob-a" aria-hidden />
                <p style={{ fontSize: 14, color: dash.muted, fontWeight: 600, position: "relative", zIndex: 1 }}>
                    Loading supervision hub…
                </p>
            </div>
        );
    }

    if (pageError || !me) {
        return (
            <div
                className="dd-root"
                style={{
                    minHeight: "100vh",
                    background: dash.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    fontFamily: dash.font,
                }}
            >
                <div style={{ ...glassCard, maxWidth: 420, padding: 28 }}>
                    <p style={{ margin: 0, fontSize: 14, color: dash.danger, fontWeight: 600 }}>
                        {pageError || "Unable to load dashboard."}
                    </p>
                    <Link
                        to="/login"
                        style={{
                            display: "inline-block",
                            marginTop: 16,
                            fontSize: 14,
                            fontWeight: 700,
                            color: dash.accent,
                        }}
                    >
                        Go to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <DoctorDashboardLayout
            doctorName={me.name}
            doctorSubtitle={doctorSubtitle}
            initials={initials}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            onLogout={handleLogout}
            navCounts={navCounts}
        >
            {activeSection === "overview" ? (
                <OverviewSection
                    me={me}
                    doctorStats={statsForOverview}
                    statsLoading={statsLoading}
                    statsError={statsError}
                    pendingPreview={pendingPreview}
                    pendingForActivity={pendingForActivity}
                    supervisedProjects={supervisedProjects}
                    actionKey={actionKey}
                    onSupervisionAction={handleSupervisionAction}
                    onViewAllRequests={() => handleSectionChange("requests")}
                    onViewActiveTeams={() => handleSectionChange("projects")}
                />
            ) : null}

            {activeSection === "requests" ? (
                <RequestsSection
                    supervisionRequests={supervisionRequests}
                    cancelRequests={cancelRequests}
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
                    onViewRequests={() => handleSectionChange("requests")}
                />
            ) : null}

            {activeSection === "deleted" ? <DeletedProjectsSection items={deletedItems} /> : null}

            {activeSection === "courses" ? <DoctorCoursesSection /> : null}
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