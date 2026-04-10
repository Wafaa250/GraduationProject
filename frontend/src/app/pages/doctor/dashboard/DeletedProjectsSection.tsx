import { Trash2 } from "lucide-react";
import type { DeletedProjectRecord } from "../doctorDeletedProjectsStorage";
import { dash, card } from "./doctorDashTokens";

type Props = {
  items: DeletedProjectRecord[];
};

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
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: dash.fontDisplay }}>History</span>
          <span style={{ fontSize: 12, color: dash.muted, marginLeft: "auto" }}>
            Local only — not synced to the server
          </span>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>No removed projects</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: dash.subtle }}>
              After you resign from a project or remove supervision on My Projects, entries appear here on this
              browser.
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((p) => (
              <li
                key={p.projectId}
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${dash.border}`,
                }}
              >
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.text }}>{p.name}</p>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: dash.subtle }}>
                  {p.source === "resign"
                    ? "Resigned"
                    : p.source === "remove_supervision"
                      ? "Removed supervision"
                      : "Recorded"}{" "}
                  · {new Date(p.removedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
