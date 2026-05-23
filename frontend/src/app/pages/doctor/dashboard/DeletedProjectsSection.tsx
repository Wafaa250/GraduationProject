import { Trash2 } from "lucide-react";
import type { DeletedProjectRecord } from "../doctorDeletedProjectsStorage";
import { dash } from "./doctorDashTokens";
import { PageHeader } from "./ui/PageHeader";

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
    <div className="dd-section-page">
      <PageHeader eyebrow="Supervision history" title="Removed supervision" />

      <div className="dd-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 22px",
            borderBottom: `1px solid ${dash.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Trash2 size={20} color={dash.muted} />
          <span style={{ fontSize: 16, fontWeight: 800, fontFamily: dash.fontDisplay }}>
            Archived locally
          </span>
          <span style={{ fontSize: 12, color: dash.muted, marginLeft: "auto" }}>
            {items.length} saved
          </span>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>Nothing here yet</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((p) => (
              <li
                key={p.projectId}
                className="dd-req-row"
                style={{
                  padding: "18px 22px",
                  borderBottom: `1px solid ${dash.border}`,
                }}
              >
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.text }}>{p.name}</p>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: dash.subtle }}>
                  Removed on {formatRemovedAt(p.removedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
