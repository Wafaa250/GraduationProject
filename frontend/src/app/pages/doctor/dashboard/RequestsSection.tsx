import { ClipboardList, Loader2 } from "lucide-react";
import type { RequestRow } from "../doctorDashboardTypes";
import { isPendingRequestStatus, supervisionRequestLabel } from "../doctorRequestUtils";
import { SectionSpinner } from "./SectionSpinner";
import { dash, card } from "./doctorDashTokens";

const ABSTRACT_PREVIEW_CHARS = 320;

function truncateText(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function formatMemberRole(role: string): string {
  const r = role?.toLowerCase();
  if (r === "leader") return "Leader";
  if (r === "member") return "Member";
  return role || "Member";
}

type Props = {
  rows: RequestRow[];
  loading: boolean;
  error: string | null;
  actionKey: string | null;
  /** Parent removes the row from state (requestId), then refetches — instant UI + server sync */
  onSupervisionAction: (requestId: number, action: "accept" | "reject") => void;
  onCancelAction: (requestId: number, action: "accept" | "reject") => void;
};

export function RequestsSection({
  rows,
  loading,
  error,
  actionKey,
  onSupervisionAction,
  onCancelAction,
}: Props) {
  return (
    <div>
      <h2
        style={{
          margin: "0 0 18px",
          fontSize: 13,
          fontWeight: 700,
          color: dash.subtle,
          letterSpacing: "0.06em",
        }}
      >
        REQUESTS
      </h2>
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${dash.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ClipboardList size={18} color={dash.accent} />
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: dash.fontDisplay }}>
            Inbox
          </span>
          <span style={{ fontSize: 12, color: dash.muted, marginLeft: "auto" }}>
            {rows.length} total
          </span>
        </div>

        {error ? (
          <div style={{ padding: "16px 20px", color: "#991b1b", fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <SectionSpinner label="Loading requests…" />
        ) : rows.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>
              No requests
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: dash.subtle }}>
              Supervision and cancellation requests will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {rows.map((row) => {
              const pending = isPendingRequestStatus(row.status);
              const statusLabel = row.status
                ? row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase()
                : "—";
              const prefix = row.kind === "supervision" ? "sup" : "can";
              const projectName = row.projectName?.trim() || "—";
              const studentName = row.studentName?.trim() || "—";
              const sup =
                row.kind === "supervision"
                  ? row
                  : null;
              const abstractPreview =
                sup?.projectAbstract?.trim()
                  ? truncateText(sup.projectAbstract, ABSTRACT_PREVIEW_CHARS)
                  : "";
              const acceptKey = `${prefix}-${row.requestId}-accept`;
              const rejectKey = `${prefix}-${row.requestId}-reject`;
              const acceptLoading = actionKey === acceptKey;
              const rejectLoading = actionKey === rejectKey;
              return (
                <div
                  key={`${row.kind}-${row.requestId}`}
                  style={{
                    padding: "16px 20px",
                    borderBottom: `1px solid ${dash.border}`,
                  }}
                  className="dd-req-row"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: dash.subtle,
                          letterSpacing: "0.04em",
                        }}
                      >
                        Project
                      </p>
                      <p
                        style={{
                          margin: "0 0 10px",
                          fontSize: 15,
                          fontWeight: 700,
                          color: dash.text,
                        }}
                      >
                        {projectName}
                      </p>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: dash.subtle,
                          letterSpacing: "0.04em",
                        }}
                      >
                        Student
                      </p>
                      <p style={{ margin: "0 0 10px", fontSize: 13, color: dash.muted }}>
                        {studentName}
                      </p>
                      {sup ? (
                        <>
                          {abstractPreview ? (
                            <div style={{ marginBottom: 12 }}>
                              <p
                                style={{
                                  margin: "0 0 4px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: dash.subtle,
                                  letterSpacing: "0.04em",
                                }}
                              >
                                Project idea
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 13,
                                  color: dash.muted,
                                  lineHeight: 1.45,
                                }}
                              >
                                {abstractPreview}
                              </p>
                            </div>
                          ) : null}
                          {sup.requiredSkills.length > 0 ? (
                            <div style={{ marginBottom: 12 }}>
                              <p
                                style={{
                                  margin: "0 0 6px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: dash.subtle,
                                  letterSpacing: "0.04em",
                                }}
                              >
                                Skills
                              </p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {sup.requiredSkills.map((s) => (
                                  <span
                                    key={s}
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      padding: "3px 8px",
                                      borderRadius: 8,
                                      background: dash.bg,
                                      color: dash.muted,
                                      border: `1px solid ${dash.border}`,
                                    }}
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {sup.teamMembers.length > 0 ? (
                            <div style={{ marginBottom: 10 }}>
                              <p
                                style={{
                                  margin: "0 0 6px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: dash.subtle,
                                  letterSpacing: "0.04em",
                                }}
                              >
                                Team ({sup.memberCount}
                                {sup.partnersCount > 0
                                  ? ` / up to ${sup.partnersCount}`
                                  : ""}
                                )
                              </p>
                              <ul
                                style={{
                                  margin: 0,
                                  paddingLeft: 18,
                                  fontSize: 13,
                                  color: dash.muted,
                                  lineHeight: 1.5,
                                }}
                              >
                                {sup.teamMembers.map((m) => (
                                  <li key={`${m.studentId}-${m.role}`} style={{ marginBottom: 2 }}>
                                    <strong style={{ color: dash.text, fontWeight: 700 }}>
                                      {m.name?.trim() || "—"}
                                    </strong>{" "}
                                    <span style={{ fontSize: 12, color: dash.subtle }}>
                                      · {formatMemberRole(m.role)}
                                      {m.major?.trim() ? ` · ${m.major.trim()}` : ""}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {sup.projectType && sup.projectType !== "GP" ? (
                            <p style={{ margin: "0 0 10px", fontSize: 12, color: dash.subtle }}>
                              Type: {sup.projectType}
                            </p>
                          ) : null}
                        </>
                      ) : null}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: row.kind === "cancellation" ? "#b45309" : dash.accent,
                        }}
                      >
                        {supervisionRequestLabel(row.kind)}
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
                        style={{ fontSize: 10, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}
                      >
                        STATUS
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: pending ? "#fef9c3" : dash.bg,
                          color: pending ? "#a16207" : dash.muted,
                        }}
                      >
                        {statusLabel}
                      </span>
                      {pending ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            disabled={actionKey != null}
                            onClick={() =>
                              row.kind === "supervision"
                                ? onSupervisionAction(row.requestId, "accept")
                                : onCancelAction(row.requestId, "accept")
                            }
                            style={{
                              padding: "8px 16px",
                              borderRadius: 10,
                              border: "none",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: actionKey ? "wait" : "pointer",
                              fontFamily: "inherit",
                              background: "linear-gradient(135deg,#6366f1,#a855f7)",
                              color: "#fff",
                              opacity: actionKey ? 0.85 : 1,
                              minWidth: 100,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                            }}
                          >
                            {acceptLoading ? (
                              <Loader2 size={14} style={{ animation: "dd-req-spin 0.7s linear infinite" }} />
                            ) : null}
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={actionKey != null}
                            onClick={() =>
                              row.kind === "supervision"
                                ? onSupervisionAction(row.requestId, "reject")
                                : onCancelAction(row.requestId, "reject")
                            }
                            style={{
                              padding: "8px 16px",
                              borderRadius: 10,
                              border: `1.5px solid ${dash.border}`,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: actionKey ? "wait" : "pointer",
                              fontFamily: "inherit",
                              background: dash.surface,
                              color: dash.muted,
                              minWidth: 100,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                            }}
                          >
                            {rejectLoading ? (
                              <Loader2 size={14} style={{ animation: "dd-req-spin 0.7s linear infinite" }} />
                            ) : null}
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        @keyframes dd-req-spin { to { transform: rotate(360deg); } }
        .dd-req-row:last-child { border-bottom: none !important; }
        .dd-req-row:hover { background: #fafbfc; }
      `}</style>
    </div>
  );
}
