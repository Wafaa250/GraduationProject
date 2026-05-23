import type { ReactNode } from "react";
import { dash } from "../doctorDashTokens";

export function SkillChip({
  children,
  accent,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 20,
        background: accent ? dash.accentMuted : "rgba(241, 245, 249, 0.95)",
        color: accent ? dash.accentDeep : dash.muted,
        border: `1px solid ${accent ? dash.accentBorder : dash.borderSoft}`,
      }}
    >
      {children}
    </span>
  );
}
