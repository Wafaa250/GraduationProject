import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Check, LayoutDashboard, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { cn } from "@/lib/utils";
import {
  COMPANY_THEME_IDS,
  COMPANY_THEME_META,
  type CompanyThemeId,
} from "@/lib/companyThemes";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { COMPANY_ROUTES } from "@/routes/paths";
import { isCompanyOwner } from "@/lib/companyWorkspace";

function ThemePreviewMock({ themeId }: { themeId: CompanyThemeId }) {
  return (
    <div className="company-workspace cw-theme-preview" data-cw-theme={themeId}>
      <div className="cw-theme-preview-mesh" aria-hidden />
      <div className="cw-theme-preview-inner">
        <div className="cw-theme-preview-top">
          <span className="cw-theme-preview-eyebrow">Workspace</span>
          <span className="cw-theme-preview-pill">3 active</span>
        </div>
        <p className="cw-theme-preview-title">Hiring pipeline</p>
        <div className="cw-theme-preview-stats">
          <div className="cw-theme-preview-stat">
            <span className="cw-theme-preview-stat-val">12</span>
            <span className="cw-theme-preview-stat-lbl">Requests</span>
          </div>
          <div className="cw-theme-preview-stat cw-theme-preview-stat--accent">
            <span className="cw-theme-preview-stat-val">87%</span>
            <span className="cw-theme-preview-stat-lbl">Match</span>
          </div>
        </div>
        <div className="cw-theme-preview-nav">
          <span className="cw-theme-preview-nav-item is-active">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </span>
          <span className="cw-theme-preview-nav-item">
            <Sparkles className="h-3.5 w-3.5" />
            Saved
          </span>
        </div>
        <button type="button" className="cw-theme-preview-cta">
          New project request
        </button>
      </div>
    </div>
  );
}

export function CompanyThemeShowcasePage() {
  if (!isCompanyOwner()) {
    return <Navigate to={COMPANY_ROUTES.dashboard} replace />;
  }

  const nav = useNavigate();
  const { theme: activeTheme, applyTheme } = useCompanyTheme();
  const [selected, setSelected] = useState<CompanyThemeId>(activeTheme);

  const apply = () => {
    applyTheme(selected);
    toast.success(`${COMPANY_THEME_META[selected].label} applied`);
    nav(COMPANY_ROUTES.dashboard);
  };

  return (
    <CompanyPageShell className="cw-theme-showcase-page pb-24">
      <header className="cw-theme-showcase-hero">
        <p className="cw-theme-showcase-hero-eyebrow">Company workspace</p>
        <h1 className="cw-theme-showcase-hero-title">Pick your palette</h1>
        <p className="cw-theme-showcase-hero-desc">
          Five complete themes — same UI, different character. Click a card, then apply to the
          whole workspace.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Active now:{" "}
          <span className="font-semibold text-foreground">
            {COMPANY_THEME_META[activeTheme].label}
          </span>
        </p>
      </header>

      <div className="cw-theme-showcase-grid">
        {COMPANY_THEME_IDS.map((id) => {
          const meta = COMPANY_THEME_META[id];
          const isSelected = selected === id;
          const isActive = activeTheme === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={cn(
                "cw-theme-showcase-card text-left",
                isSelected && "is-selected",
              )}
            >
              <div className="cw-theme-showcase-card-head">
                <div>
                  <h2 className="cw-theme-showcase-card-title">{meta.label}</h2>
                  <p className="cw-theme-showcase-card-tagline">{meta.tagline}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {isActive ? (
                    <span className="cw-theme-showcase-live">Live</span>
                  ) : null}
                  {isSelected ? (
                    <span className="cw-theme-showcase-check" aria-hidden>
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="cw-theme-showcase-card-mood">{meta.mood}</p>
              <ThemePreviewMock themeId={id} />
            </button>
          );
        })}
      </div>

      <div className="cw-theme-showcase-bar">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {COMPANY_THEME_META[selected].label}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {COMPANY_THEME_META[selected].tagline}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link to={COMPANY_ROUTES.dashboard}>Cancel</Link>
          </Button>
          <Button className="rounded-xl cw-btn-gradient gap-2" onClick={apply}>
            Apply to workspace
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CompanyPageShell>
  );
}
