import type { ReactNode } from "react";
import { BrandLogoMark } from "../../../../components/brand/BrandLogo";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  actions,
  compact,
}: Props) {
  const trailing = action ?? actions;

  return (
    <div
      className={compact ? "dd-page-header dd-page-header-compact" : "dd-page-header"}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        {eyebrow ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <BrandLogoMark size="xs" />
            <p className="dd-page-eyebrow" style={{ margin: 0 }}>
              {eyebrow}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <BrandLogoMark size="xs" />
          </div>
        )}
        <h1 className="dd-page-title">{title}</h1>
        {subtitle ? <p className="dd-page-subtitle">{subtitle}</p> : null}
      </div>
      {trailing ? <div className="dd-page-actions">{trailing}</div> : null}
    </div>
  );
}
