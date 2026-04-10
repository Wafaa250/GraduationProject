import type { CSSProperties } from "react";
import { ClipboardList } from "lucide-react";
import type { RequestRow } from "../doctorDashboardTypes";
import { isPendingRequestStatus } from "../doctorRequestUtils";
import { SectionSpinner } from "./SectionSpinner";
import { cardStyle, dash } from "./doctorDashTokens";

type Props = {
  rows: RequestRow[];
  loading: boolean;
  error: string | null;
  actionKey: string | null;
  onSupervisionAction: (requestId: number, action: "accept" | "reject") => void;
};

export function RequestsSection({
  rows,
  loading,
  error,
  actionKey,
  onSupervisionAction,
}: Props) {
  return (
    <div className="doctor-dash-section-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...cardStyle, padding: "20px 22px" }}>
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: dash.subtle,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ClipboardList size={15} color={dash.accent} /> Supervisor requests
        </h2>

        {error ? (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: dash.radiusMd,
              border: "1px solid #fecaca",
              background: dash.dangerSoft,
              color: dash.danger,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <SectionSpinner label="Loading requests…" />
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>No requests</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: dash.subtle }}>
              Nothing returned from <code style={{ fontSize: 11 }}>GET /doctors/me/requests</code>.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map((row) => {
              const pending = isPendingRequestStatus(row.status);
              const statusLabel = row.status
                ? row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase()
                : "—";
              const prefix = "sup";
              return (
                <div
                  key={`${row.kind}-${row.requestId}`}
                  style={{
                    ...cardStyle,
                    padding: "16px 18px",
                    boxShadow: "none",
                    border: `1px solid ${dash.border}`,
                  }}
                  className="doctor-dash-request-card"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: dash.text }}>
                        {row.projectName || "Project"}
                      </p>
                      <p style={{ margin: "0 0 8px", fontSize: 13, color: dash.muted }}>{row.studentName || "—"}</p>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: dash.accent,
                        }}
                      >
                        Supervision request
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: pending ? "#fef9c3" : "#f1f5f9",
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
                            onClick={() => onSupervisionAction(row.requestId, "accept")}
                            style={btnPrimary}
                          >
                            {actionKey === `${prefix}-${row.requestId}-accept` ? "…" : "Accept"}
                          </button>
                          <button
                            type="button"
                            disabled={actionKey != null}
                            onClick={() => onSupervisionAction(row.requestId, "reject")}
                            style={btnGhost}
                          >
                            {actionKey === `${prefix}-${row.requestId}-reject` ? "…" : "Reject"}
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
    </div>
  );
}

const btnPrimary: CSSProperties = {
  padding: "8px 16px",
  borderRadius: dash.radiusMd,
  border: "none",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: dash.font,
  background: `linear-gradient(135deg,${dash.accent},#9333ea)`,
  color: "#fff",
};

const btnGhost: CSSProperties = {
  padding: "8px 16px",
  borderRadius: dash.radiusMd,
  border: `1px solid ${dash.border}`,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: dash.font,
  background: dash.surface,
  color: dash.muted,
};
