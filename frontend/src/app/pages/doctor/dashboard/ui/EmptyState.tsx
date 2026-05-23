import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BrandLogoMark } from "../../../../components/brand/BrandLogo";
import { dash } from "../doctorDashTokens";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="dd-panel" style={{ padding: "40px 28px", textAlign: "center" }}>
      <BrandLogoMark size="lg" className="mx-auto mb-3 opacity-90" />
      <Icon size={28} color={dash.subtle} style={{ marginBottom: 12 }} />
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.muted }}>{title}</p>
      {description ? (
        <p
          className="dd-text-desc"
          style={{
            margin: "10px auto 0",
            maxWidth: 420,
          }}
        >
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: 18 }}>{action}</div> : null}
    </div>
  );
}
