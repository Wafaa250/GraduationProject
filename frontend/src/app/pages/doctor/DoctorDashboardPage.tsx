import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
  type RefObject,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Settings,
  Briefcase,
  ClipboardList,
  Users,
} from "lucide-react";
import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
  getDoctorRequests,
  getDoctorSupervisorCancelRequests,
  acceptSupervisorRequest,
  rejectSupervisorRequest,
  acceptSupervisorCancelRequest,
  rejectSupervisorCancelRequest,
  type SupervisorRequest,
  type SupervisorCancelRequestItem,
} from "../../../api/supervisorApi";

// ─── /me (doctor) ───────────────────────────────────────────────────────────
interface DoctorMeResponse {
  role: string;
  profileId: number;
  name: string;
  email: string;
  specialization?: string | null;
}

// ─── GET /graduation-projects list item (subset) ─────────────────────────────
interface GradProjectListItem {
  id: number;
  name: string;
  currentMembers: number;
  isFull: boolean;
  supervisor?: {
    doctorId: number;
    name: string;
    specialization?: string | null;
  } | null;
}

type RequestRow =
  | {
      kind: "supervision";
      requestId: number;
      projectName: string;
      studentName: string;
      status: string;
    }
  | {
      kind: "cancellation";
      requestId: number;
      projectName: string;
      studentName: string;
      status: string;
    };

function isPending(status: string): boolean {
  return status?.toLowerCase() === "pending";
}

function requestLabel(kind: RequestRow["kind"]): string {
  return kind === "supervision"
    ? "Supervision request"
    : "Cancellation request";
}

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const requestsRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);

  const [me, setMe] = useState<DoctorMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [supervisionRequests, setSupervisionRequests] = useState<
    SupervisorRequest[]
  >([]);
  const [cancelRequests, setCancelRequests] = useState<
    SupervisorCancelRequestItem[]
  >([]);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [supervisedProjects, setSupervisedProjects] = useState<
    GradProjectListItem[]
  >([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [actionKey, setActionKey] = useState<string | null>(null);

  const scrollTo = (ref: RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
        console.error(
          "[DoctorDashboard] GET /doctors/me/requests failed",
          supResult.reason,
        );
      }
      if (canResult.status === "rejected") {
        console.error(
          "[DoctorDashboard] GET /doctors/me/supervisor-cancel-requests failed",
          canResult.reason,
        );
      }

      setSupervisionRequests(
        supResult.status === "fulfilled" ? supResult.value : [],
      );
      setCancelRequests(
        canResult.status === "fulfilled" ? canResult.value : [],
      );

      const failures = settled.filter(
        (r) => r.status === "rejected",
      ) as PromiseRejectedResult[];
      if (failures.length === 2) {
        const msg = parseApiErrorMessage(failures[0].reason);
        setRequestsError(msg);
      } else if (failures.length === 1) {
        const msg = parseApiErrorMessage(failures[0].reason);
        setRequestsError(
          `Could not load all requests (${msg}). The other list may still be shown below.`,
        );
      }
    } catch (err: unknown) {
      console.error("[DoctorDashboard] loadRequests unexpected error", err);
      setRequestsError(parseApiErrorMessage(err));
      setSupervisionRequests([]);
      setCancelRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const loadSupervisedProjects = useCallback(
    async (doctorProfileId: number) => {
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        const { data } = await api.get<GradProjectListItem[]>(
          "/graduation-projects",
        );
        const list = Array.isArray(data) ? data : [];
        setSupervisedProjects(
          list.filter(
            (p) =>
              p.supervisor != null && p.supervisor.doctorId === doctorProfileId,
          ),
        );
      } catch (err: unknown) {
        console.error("[DoctorDashboard] GET /graduation-projects failed", err);
        setProjectsError(parseApiErrorMessage(err));
        setSupervisedProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const { data } = await api.get<DoctorMeResponse>("/me");
        if (data.role !== "doctor" || data.profileId == null) {
          setLoadError("This account is not a doctor profile.");
          setMe(null);
          return;
        }
        setMe(data);
        await Promise.all([
          loadRequests(),
          loadSupervisedProjects(data.profileId),
        ]);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setLoadError("Could not load your account.");
        setMe(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [navigate, loadRequests, loadSupervisedProjects]);

  const mergedRows: RequestRow[] = [
    ...supervisionRequests.map((r) => ({
      kind: "supervision" as const,
      requestId: r.requestId,
      projectName: r.project?.name ?? "",
      studentName: r.sender?.name ?? "",
      status: r.status,
    })),
    ...cancelRequests.map((r) => ({
      kind: "cancellation" as const,
      requestId: r.requestId,
      projectName: r.projectName,
      studentName: r.studentName,
      status: r.status,
    })),
  ].sort((a, b) => {
    const pa = isPending(a.status) ? 0 : 1;
    const pb = isPending(b.status) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (a.kind !== b.kind) return a.kind === "supervision" ? -1 : 1;
    return b.requestId - a.requestId;
  });

  const pendingCount = mergedRows.filter((r) => isPending(r.status)).length;

  const handleSupervisionAction = async (
    requestId: number,
    action: "accept" | "reject",
  ) => {
    const key = `sup-${requestId}-${action}`;
    setActionKey(key);
    try {
      if (action === "accept") await acceptSupervisorRequest(requestId);
      else await rejectSupervisorRequest(requestId);
      await loadRequests();
      if (me) await loadSupervisedProjects(me.profileId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      alert(typeof msg === "string" ? msg : "Action failed.");
    } finally {
      setActionKey(null);
    }
  };

  const handleCancelAction = async (
    requestId: number,
    action: "accept" | "reject",
  ) => {
    const key = `can-${requestId}-${action}`;
    setActionKey(key);
    try {
      if (action === "accept") await acceptSupervisorCancelRequest(requestId);
      else await rejectSupervisorCancelRequest(requestId);
      await loadRequests();
      if (me) await loadSupervisedProjects(me.profileId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      alert(typeof msg === "string" ? msg : "Action failed.");
    } finally {
      setActionKey(null);
    }
  };

  const projectStatusLabel = (p: GradProjectListItem): string => {
    if (p.isFull) return "Team full";
    return "Recruiting";
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>
          Loading…
        </p>
      </div>
    );
  }

  if (loadError || !me) {
    return (
      <div style={S.page}>
        <BgDecor />
        <div style={{ ...S.content, maxWidth: 560 }}>
          <div style={S.card}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "#ef4444",
                fontWeight: 600,
              }}
            >
              {loadError || "Unable to load dashboard."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{ ...S.heroBtn, marginTop: 14 }}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <BgDecor />

      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link to="/" style={S.navLogo}>
            <div style={S.logoIconWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={S.logoText}>
              Skill<span style={S.logoAccent}>Swap</span>
            </span>
          </Link>
          <div style={S.navActions}>
            <Link to="/settings" style={S.navBtn}>
              <Settings size={17} />
            </Link>
            <button
              type="button"
              style={S.navBtn}
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
            >
              <LogOut size={16} />
            </button>
            <Link to="/profile" style={S.navAvatar}>
              <div style={S.navAvatarFallback}>
                {me.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "DR"}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      <div style={S.content}>
        <div style={S.hero}>
          <div style={S.heroLeft}>
            <h1 style={S.heroTitle}>Doctor Dashboard</h1>
            <p style={S.heroSub}>
              Manage your supervised projects and requests
            </p>
            <p style={S.heroMeta}>
              {me.name}
              {me.specialization ? ` · ${me.specialization}` : ""}
            </p>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => scrollTo(requestsRef)}
                style={S.heroBtn}
              >
                <ClipboardList size={15} /> View requests
              </button>
              <button
                type="button"
                onClick={() => scrollTo(projectsRef)}
                style={{
                  ...S.heroBtn,
                  background: "white",
                  color: "#6366f1",
                  border: "1.5px solid #c7d2fe",
                }}
              >
                <Briefcase size={15} /> My projects
              </button>
            </div>
          </div>
          <div style={S.heroStats}>
            <div style={S.statCard}>
              <div style={S.statIcon}>
                <ClipboardList size={18} />
              </div>
              <div>
                <p style={S.statValue}>{pendingCount}</p>
                <p style={S.statLabel}>Pending requests</p>
              </div>
            </div>
            <div style={S.statCard}>
              <div style={S.statIcon}>
                <Briefcase size={18} />
              </div>
              <div>
                <p style={S.statValue}>{supervisedProjects.length}</p>
                <p style={S.statLabel}>Supervised projects</p>
              </div>
            </div>
          </div>
        </div>

        <div style={S.stack}>
          <div ref={requestsRef} id="doctor-requests" style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.cardTitle}>
                <ClipboardList size={15} color="#6366f1" /> Supervisor requests
              </h2>
            </div>
            {requestsError && (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  color: "#ef4444",
                  fontWeight: 600,
                }}
              >
                {requestsError}
              </p>
            )}
            {requestsLoading ? (
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                Loading requests…
              </p>
            ) : mergedRows.length === 0 ? (
              <div style={S.emptyState}>
                <p style={S.emptyTitle}>No requests</p>
                <p style={S.emptyDesc}>
                  Supervision and cancellation requests will appear here.
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {mergedRows.map((row) => {
                  const pending = isPending(row.status);
                  const statusLabel = row.status
                    ? row.status.charAt(0).toUpperCase() +
                      row.status.slice(1).toLowerCase()
                    : "—";
                  return (
                    <div
                      key={`${row.kind}-${row.requestId}`}
                      style={{
                        padding: "14px 16px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                          <p
                            style={{
                              margin: "0 0 4px",
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            {row.projectName || "Project"}
                          </p>
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: 12,
                              color: "#64748b",
                            }}
                          >
                            {row.studentName || "—"}
                          </p>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color:
                                row.kind === "cancellation"
                                  ? "#b45309"
                                  : "#6366f1",
                            }}
                          >
                            {requestLabel(row.kind)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: 20,
                              background: pending ? "#fef9c3" : "#f1f5f9",
                              color: pending ? "#a16207" : "#64748b",
                            }}
                          >
                            {statusLabel}
                          </span>
                          {pending && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                type="button"
                                disabled={actionKey != null}
                                onClick={() =>
                                  row.kind === "supervision"
                                    ? handleSupervisionAction(
                                        row.requestId,
                                        "accept",
                                      )
                                    : handleCancelAction(
                                        row.requestId,
                                        "accept",
                                      )
                                }
                                style={S.acceptBtn}
                              >
                                {actionKey ===
                                `${row.kind === "supervision" ? "sup" : "can"}-${row.requestId}-accept`
                                  ? "…"
                                  : "Accept"}
                              </button>
                              <button
                                type="button"
                                disabled={actionKey != null}
                                onClick={() =>
                                  row.kind === "supervision"
                                    ? handleSupervisionAction(
                                        row.requestId,
                                        "reject",
                                      )
                                    : handleCancelAction(
                                        row.requestId,
                                        "reject",
                                      )
                                }
                                style={S.rejectBtn}
                              >
                                {actionKey ===
                                `${row.kind === "supervision" ? "sup" : "can"}-${row.requestId}-reject`
                                  ? "…"
                                  : "Reject"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div ref={projectsRef} id="doctor-projects" style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.cardTitle}>
                <Users size={15} color="#6366f1" /> My projects
              </h2>
            </div>
            {projectsError && (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  color: "#ef4444",
                  fontWeight: 600,
                }}
              >
                {projectsError}
              </p>
            )}
            {projectsLoading ? (
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                Loading projects…
              </p>
            ) : supervisedProjects.length === 0 ? (
              <div style={S.emptyState}>
                <p style={S.emptyTitle}>No supervised projects yet</p>
                <p style={S.emptyDesc}>
                  Projects you supervise will show here.
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {supervisedProjects.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      padding: "14px 16px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {p.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                        {p.currentMembers} student
                        {p.currentMembers !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "5px 12px",
                        borderRadius: 20,
                        background: p.isFull ? "#dcfce7" : "#eef2ff",
                        color: p.isFull ? "#166534" : "#6366f1",
                      }}
                    >
                      {projectStatusLabel(p)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        button:hover:not(:disabled) { opacity: 0.92; }
        a { text-decoration: none; }
      `}</style>
    </div>
  );
}

function BgDecor() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: -150,
          right: -150,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -120,
          left: -120,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)",
    fontFamily: "DM Sans, sans-serif",
    color: "#0f172a",
    position: "relative",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(248,247,255,0.88)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(99,102,241,0.1)",
  },
  navInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    height: 62,
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  navLogo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    marginRight: 8,
    flexShrink: 0,
  },
  logoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
  },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    fontFamily: "Syne, sans-serif",
  },
  logoAccent: {
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  navBtn: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    borderRadius: 8,
    textDecoration: "none",
  },
  navAvatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    overflow: "hidden",
    cursor: "pointer",
    marginLeft: 4,
    textDecoration: "none",
    flexShrink: 0,
  },
  navAvatarFallback: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "#fff",
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "28px 24px 60px",
    position: "relative",
    zIndex: 1,
  },
  hero: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 24,
    padding: "24px 28px",
    background: "white",
    border: "1px solid rgba(99,102,241,0.12)",
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(99,102,241,0.06)",
    flexWrap: "wrap",
  },
  heroLeft: {
    flex: "1 1 280px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
    fontFamily: "Syne, sans-serif",
    lineHeight: 1.2,
  },
  heroSub: {
    fontSize: 14,
    color: "#64748b",
    margin: "0 0 8px",
    fontWeight: 500,
  },
  heroMeta: { fontSize: 13, color: "#94a3b8", margin: 0 },
  heroBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  heroStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    flexShrink: 0,
    minWidth: 220,
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#6366f1",
  },
  statValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 2px",
    fontFamily: "Syne, sans-serif",
  },
  statLabel: { fontSize: 10, color: "#94a3b8", margin: 0, fontWeight: 500 },
  stack: { display: "flex", flexDirection: "column", gap: 20 },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: "18px",
    boxShadow: "0 2px 12px rgba(99,102,241,0.04)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 6,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px",
    gap: 8,
    textAlign: "center",
  },
  emptyTitle: { fontSize: 14, fontWeight: 700, color: "#475569", margin: 0 },
  emptyDesc: {
    fontSize: 12,
    color: "#94a3b8",
    margin: 0,
    maxWidth: 280,
    lineHeight: 1.6,
  },
  acceptBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "none",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    color: "white",
  },
  rejectBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    background: "white",
    color: "#64748b",
  },
};
