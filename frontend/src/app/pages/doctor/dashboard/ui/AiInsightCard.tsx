import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { dash } from "../doctorDashTokens";

export function AiInsightCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="dd-panel"
      style={{
        padding: 20,
        border: `1px solid ${dash.accentBorder}`,
        background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(237,233,254,0.5))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Sparkles size={16} color={dash.accent} />
        <h3 className="dd-card-title" style={{ margin: 0, color: dash.text }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
