import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  AI_PANEL_SPIN_KEYFRAMES,
  aiPanelStyles as S,
} from "./aiRecommendationPanelStyles";

export type AiRecommendationPanelUiState =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error";

export interface AiRecommendationPanelProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  actionLabel: string;
  loadingActionLabel?: string;
  loadingTitle?: string;
  loadingSub?: string;
  onAction: () => void;
  uiState: AiRecommendationPanelUiState;
  errorMessage?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  canTrigger: boolean;
  permissionHint?: string;
  actionDisabled?: boolean;
  resultCount?: number;
  resultNoun?: string;
  children?: ReactNode;
  sectionStyle?: CSSProperties;
}

export function AiRecommendationPanel({
  title,
  subtitle,
  icon,
  actionLabel,
  loadingActionLabel = "Analyzing…",
  loadingTitle = "Finding matches",
  loadingSub = "This may take a few seconds.",
  onAction,
  uiState,
  errorMessage,
  emptyTitle = "No matches returned",
  emptyDescription = "Try again in a few minutes or refine your project skills and abstract.",
  canTrigger,
  permissionHint = "Only the project owner or team leader can run AI recommendations.",
  actionDisabled = false,
  resultCount = 0,
  resultNoun = "recommendation",
  children,
  sectionStyle,
}: AiRecommendationPanelProps): ReactElement {
  const [listExpanded, setListExpanded] = useState(true);
  const isLoading = uiState === "loading";
  const hasResults = uiState === "success" && resultCount > 0;

  useEffect(() => {
    if (hasResults) setListExpanded(true);
  }, [hasResults, resultCount]);

  const primaryDisabled = isLoading || actionDisabled || !canTrigger;

  return (
    <section style={{ ...S.section, ...sectionStyle }}>
      <header style={S.blockHeader}>
        <div style={S.blockTitleRow}>
          <span style={S.iconWrap} aria-hidden>
            {icon}
          </span>
          <div>
            <p style={S.blockTitle}>{title}</p>
            <p style={S.blockSub}>{subtitle}</p>
          </div>
        </div>
      </header>

      {!canTrigger ? (
        <p style={S.hintMuted}>{permissionHint}</p>
      ) : (
        <div style={S.actionsRow}>
          <button
            type="button"
            onClick={onAction}
            disabled={primaryDisabled}
            style={{
              ...S.primaryBtn,
              ...(primaryDisabled ? S.primaryBtnDisabled : {}),
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} style={S.spinIcon} aria-hidden />
                {loadingActionLabel}
              </>
            ) : (
              <>
                <Sparkles size={14} aria-hidden />
                {actionLabel}
              </>
            )}
          </button>
          {hasResults && (
            <button
              type="button"
              onClick={() => setListExpanded((v) => !v)}
              style={S.collapseToggle}
              aria-expanded={listExpanded}
            >
              {listExpanded ? (
                <>
                  <ChevronUp size={14} aria-hidden />
                  Hide list
                </>
              ) : (
                <>
                  <ChevronDown size={14} aria-hidden />
                  Show {resultCount}{" "}
                  {resultCount === 1 ? resultNoun : `${resultNoun}s`}
                </>
              )}
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div style={S.loadingBox} role="status" aria-live="polite">
          <Loader2 size={22} color="#6366f1" style={S.spinIcon} aria-hidden />
          <div>
            <p style={S.loadingTitle}>{loadingTitle}</p>
            <p style={S.loadingSub}>{loadingSub}</p>
          </div>
        </div>
      )}

      {uiState === "error" && errorMessage && (
        <div style={S.errorBox} role="alert">
          <AlertCircle
            size={18}
            color="#dc2626"
            style={{ flexShrink: 0, marginTop: 2 }}
            aria-hidden
          />
          <div style={{ minWidth: 0 }}>
            <p style={S.errorTitle}>Could not load recommendations</p>
            <p style={S.errorBody}>{errorMessage}</p>
          </div>
        </div>
      )}

      {uiState === "empty" && (
        <div style={S.emptyBox}>
          <p style={S.emptyTitle}>{emptyTitle}</p>
          <p style={S.emptyDesc}>{emptyDescription}</p>
        </div>
      )}

      {hasResults && (
        <>
          <div style={S.resultsBar}>
            <div>
              <p style={S.resultsBarLabel}>
                {resultCount}{" "}
                {resultCount === 1 ? resultNoun : `${resultNoun}s`} found
              </p>
              <p style={S.resultsBarMeta}>
                {listExpanded
                  ? "Ranked by AI from your project context"
                  : "List hidden — expand to review matches"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setListExpanded((v) => !v)}
              style={S.collapseToggle}
              aria-expanded={listExpanded}
            >
              {listExpanded ? (
                <>
                  <ChevronUp size={14} aria-hidden />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown size={14} aria-hidden />
                  Expand
                </>
              )}
            </button>
          </div>
          {listExpanded && <div style={S.resultsBody}>{children}</div>}
        </>
      )}
      <style>{AI_PANEL_SPIN_KEYFRAMES}</style>
    </section>
  );
}
