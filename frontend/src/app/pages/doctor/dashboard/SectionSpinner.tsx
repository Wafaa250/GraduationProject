import { Loader2 } from "lucide-react";
import { dash } from "./doctorDashTokens";

export function SectionSpinner({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "40px 20px",
        color: dash.muted,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: dash.font,
      }}
    >
      <Loader2 size={22} color={dash.accent} className="doctor-dash-spin" />
      {label ?? "Loading…"}
      <style>{`
        .doctor-dash-spin { animation: doctorDashSpin 0.75s linear infinite; }
        @keyframes doctorDashSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
