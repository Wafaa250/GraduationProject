import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supervisedProjectsQueryKey } from "../../../api/doctorDashboardQueryKeys";
import { getGraduationProjectById } from "../../../api/gradProjectApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { ToastProvider, useToast } from "../../../context/ToastContext";
import { appendDeletedProject } from "./doctorDeletedProjectsStorage";
import type { DoctorSupervisedProject } from "./doctorDashboardTypes";
import { SectionSpinner } from "./dashboard/SectionSpinner";
import { card, dash } from "./dashboard/doctorDashTokens";
import ProfileLink from "../../components/common/ProfileLink";

function DoctorProjectDetailsInner() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { projectId: projectIdParam } = useParams();
  const projectId = Number(projectIdParam);
  const validId = Number.isFinite(projectId) && projectId > 0;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["graduation-project", projectId],
    queryFn: () => getGraduationProjectById(projectId),
    enabled: validId,
  });

  const resignMutation = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Project not loaded");
      appendDeletedProject({
        projectId,
        name: data.name,
        removedAt: new Date().toISOString(),
        source: "resign",
      });
      queryClient.setQueryData<DoctorSupervisedProject[]>(supervisedProjectsQueryKey, (old) =>
        (old ?? []).filter((x) => x.projectId !== projectId),
      );
      queryClient.removeQueries({ queryKey: ["graduation-project", projectId] });
    },
    onSuccess: () => {
      showToast("Resignation recorded (saved on this device only).", "success");
      navigate("/doctor-dashboard", { replace: true, state: { defaultSection: "deleted" } });
    },
    onError: (err: unknown) => {
      showToast(err instanceof Error ? err.message : parseApiErrorMessage(err), "error");
    },
  });

  if (!validId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: dash.bg,
          padding: 24,
          fontFamily: dash.font,
        }}
      >
        <p style={{ color: dash.danger, fontWeight: 700 }}>Invalid project link.</p>
        <Link to="/doctor-dashboard" style={{ color: dash.accent, fontWeight: 600 }}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  const abstractText =
    (data?.abstract ?? data?.description)?.trim() || null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dash.bg,
        padding: "24px 20px 48px",
        fontFamily: dash.font,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          to="/doctor-dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 600,
            color: dash.accent,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={18} /> Back to dashboard
        </Link>

        {isLoading ? (
          <SectionSpinner label="Loading project…" />
        ) : isError ? (
          <div
            style={{
              ...card,
              padding: 20,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: dash.danger,
              fontWeight: 600,
            }}
          >
            {parseApiErrorMessage(error)}
          </div>
        ) : data ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...card, padding: "22px 24px" }}>
              <h1
                style={{
                  margin: "0 0 12px",
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: dash.fontDisplay,
                  letterSpacing: "-0.02em",
                  color: dash.text,
                }}
              >
                {data.name}
              </h1>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: dash.subtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Abstract
              </p>
              <p style={{ margin: 0, fontSize: 14, color: dash.muted, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {abstractText ?? "—"}
              </p>
            </div>

            <div style={{ ...card, padding: "20px 22px" }}>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: dash.subtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Required skills
              </p>
              {data.requiredSkills?.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {data.requiredSkills.map((skill, idx) => (
                    <span
                      key={`${data.id}-sk-${idx}`}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: dash.accentMuted,
                        color: dash.accent,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 14, color: dash.muted }}>—</span>
              )}
            </div>

            <div style={{ ...card, padding: "20px 22px" }}>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: dash.subtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Supervisor
              </p>
              {data.supervisor ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: dash.text, lineHeight: 1.6 }}>
                  <li>
                    <strong style={{ color: dash.muted }}>Name:</strong>{" "}
                    <ProfileLink userId={data.supervisor.doctorId} role="doctor">
                      {data.supervisor.name}
                    </ProfileLink>
                  </li>
                  <li>
                    <strong style={{ color: dash.muted }}>Doctor ID:</strong> {data.supervisor.doctorId}
                  </li>
                  <li>
                    <strong style={{ color: dash.muted }}>Specialization:</strong>{" "}
                    {data.supervisor.specialization?.trim() ? data.supervisor.specialization : "—"}
                  </li>
                  {data.supervisor.department != null && data.supervisor.department !== "" ? (
                    <li>
                      <strong style={{ color: dash.muted }}>Department:</strong> {data.supervisor.department}
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: dash.muted }}>No supervisor assigned.</p>
              )}
            </div>

            <div style={{ ...card, padding: "20px 22px" }}>
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: dash.subtle,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Members
              </p>
              {data.members?.length ? (
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {data.members.map((m) => (
                    <li
                      key={`${m.studentId}-${m.userId}`}
                      style={{
                        padding: "12px 14px",
                        borderRadius: dash.radiusMd,
                        border: `1px solid ${dash.border}`,
                        background: "#f8fafc",
                      }}
                    >
                      <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: dash.text }}>
                        <ProfileLink userId={m.userId} role="student" style={{ color: dash.text }}>
                          {m.name}
                        </ProfileLink>
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: dash.muted }}>
                        {String(m.role).toLowerCase() === "leader" ? "Leader" : "Member"}
                        {m.university ? ` · ${m.university}` : ""}
                        {m.major ? ` · ${m.major}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: dash.muted }}>No members listed.</p>
              )}
            </div>

            <div style={{ ...card, padding: "20px 22px", border: `1px solid ${dash.border}` }}>
              <button
                type="button"
                disabled={resignMutation.isPending}
                onClick={() => resignMutation.mutate()}
                style={{
                  padding: "10px 18px",
                  borderRadius: dash.radiusMd,
                  border: "1px solid #fecaca",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: resignMutation.isPending ? "not-allowed" : "pointer",
                  fontFamily: dash.font,
                  background: dash.surface,
                  color: dash.danger,
                  opacity: resignMutation.isPending ? 0.75 : 1,
                }}
              >
                {resignMutation.isPending ? "Resigning…" : "Resign from Project"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DoctorProjectDetailsPage() {
  return (
    <ToastProvider>
      <DoctorProjectDetailsInner />
    </ToastProvider>
  );
}
