import { ClipboardList } from "lucide-react";
import type { SupervisorRequest } from "../../../../api/supervisorApi";
import { isPendingRequestStatus } from "../doctorRequestUtils";
import { SectionSpinner } from "./SectionSpinner";
import { dash, card } from "./doctorDashTokens";

type Props = {
  /** GET /api/doctors/me/requests */
  requests: SupervisorRequest[];
  loading: boolean;
  error: string | null;
  actionKey: string | null;
  onAction: (requestId: number, action: "accept" | "reject") => void;
};

export function RequestsSection({ requests, loading, error, actionKey, onAction }: Props) {
  return (
    <div>
      <h2 style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>
        SUPERVISION REQUESTS
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
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: dash.fontDisplay }}>Requests</span>
          <span style={{ fontSize: 12, color: dash.muted, marginLeft: "auto" }}>{requests.length} total</span>
        </div>

        {error ? (
          <div style={{ padding: "16px 20px", color: "#991b1b", fontSize: 13, fontWeight: 600 }}>{error}</div>
        ) : null}

        {loading ? (
          <SectionSpinner label="Loading requests…" />
        ) : requests.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>No requests yet</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: dash.subtle }}>
              When students request supervision, they will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {requests.map((req) => {
              const pending = isPendingRequestStatus(req.status);
              const statusLabel = req.status
                ? req.status.charAt(0).toUpperCase() + req.status.slice(1).toLowerCase()
                : "—";
              const prefix = `sup-${req.requestId}`;
              const projectName = req.project?.name?.trim() || "—";
              const senderName = req.sender?.name?.trim() || "—";
              return (
                <div
                  key={req.requestId}
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
                      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.04em" }}>
                        Project
                      </p>
                      <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: dash.text }}>{projectName}</p>
                      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.04em" }}>
                        Student
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>{senderName}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>STATUS</span>
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
                            onClick={() => onAction(req.requestId, "accept")}
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
                              opacity: actionKey ? 0.7 : 1,
                            }}
                          >
                            {actionKey === `${prefix}-accept` ? "…" : "Accept"}
                          </button>
                          <button
                            type="button"
                            disabled={actionKey != null}
                            onClick={() => onAction(req.requestId, "reject")}
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
                            }}
                          >
                            {actionKey === `${prefix}-reject` ? "…" : "Reject"}
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
        .dd-req-row:last-child { border-bottom: none !important; }
        .dd-req-row:hover { background: #fafbfc; }
      `}</style>
    </div>
  );
}
