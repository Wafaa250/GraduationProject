import { Trash2 } from "lucide-react";
import type { DeletedProjectRecord } from "../doctorDeletedProjectsStorage";
import { dash, card } from "./doctorDashTokens";

type Props = {
  items: DeletedProjectRecord[];
};

function formatRemovedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

export function DeletedProjectsSection({ items }: Props) {
  return (
    <div>
      <h2 style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>
        DELETED PROJECTS
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
          <Trash2 size={18} color={dash.muted} />
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: dash.fontDisplay }}>
            Removed supervision
          </span>
          <span style={{ fontSize: 12, color: dash.muted, marginLeft: "auto" }}>{items.length} saved</span>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>Nothing here yet</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: dash.subtle }}>
              When you cancel supervision from My Projects, the project is listed here with the removal date.
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((p) => (
              <li
                key={p.projectId}
                className="dd-deleted-row"
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${dash.border}`,
                  transition: "background 0.15s ease",
                }}
              >
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.text }}>{p.name}</p>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: dash.subtle }}>
                  Removed by you on {formatRemovedAt(p.removedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <style>{`
        .dd-deleted-row:hover { background: #fafbfc; }
      `}</style>
    </div>
  );
}
