import { Trash2 } from "lucide-react";
import type { DeletedProjectRecord } from "../doctorDeletedProjectsStorage";
import { cardStyle, dash } from "./doctorDashTokens";

type Props = {
  items: DeletedProjectRecord[];
};

export function DeletedProjectsSection({ items }: Props) {
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
          <Trash2 size={15} color={dash.muted} /> Deleted projects
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: dash.subtle }}>
          Stored locally on this device. Clearing site data removes this list.
        </p>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 16px" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>No deleted projects</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: dash.subtle }}>
              Projects you remove from supervision appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((p) => (
              <div
                key={p.projectId}
                style={{
                  padding: "14px 16px",
                  borderRadius: dash.radiusMd,
                  border: `1px dashed ${dash.border}`,
                  background: "#f8fafc",
                }}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>{p.name}</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: dash.subtle }}>
                  Removed · {new Date(p.removedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
