import type { CSSProperties, ReactElement } from "react";
import { Loader2, Sparkles, Star } from "lucide-react";
import ProfileLink from "../common/ProfileLink";
import { AiRecommendationPanel } from "./AiRecommendationPanel";
import { aiPanelStyles } from "./aiRecommendationPanelStyles";

export type AiSupervisorRecommendUiState =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error";

/** One row after merging AI results with GET recommended-supervisors (real names only). */
/** POST /api/ai/recommend-supervisors returns doctorId = profile id; profile links need userId from GET recommended-supervisors. */
export interface EnrichedAiSupervisorRow {
  doctorId: number;
  /** AspNetUsers.Id for /doctors/:id and ProfileLink */
  doctorUserId: number;
  matchScore: number;
  reason: string;
  name: string | null;
  specialization: string | null;
}

/** Per-card request UX (merged with server supervision state in merge helper). */
export type AiSupervisorCardRequestPhase =
  | "idle"
  | "sending"
  | "requested"
  | "error"
  | "unavailable";

export interface AiSupervisorCardRequestState {
  phase: AiSupervisorCardRequestPhase;
  /** Error text, unavailable reason, or success / pending hint */
  detail?: string;
}

/** Snapshot from `gradProject` for merging — avoids coupling this file to GradProject. */
export interface AiSupervisionSnapshot {
  hasAssignedSupervisor: boolean;
  /** Normalized lowercase, e.g. pending | rejected | accepted */
  requestStatusNorm: string;
  pendingDoctorId: number | null;
}

/**
 * Single source of truth for how each AI card should render request UI.
 * Server state wins over optimistic local state when it constrains actions.
 */
export function mergeAiSupervisorCardRequestState(
  doctorId: number,
  snapshot: AiSupervisionSnapshot,
  local: AiSupervisorCardRequestState | undefined,
): AiSupervisorCardRequestState {
  if (snapshot.hasAssignedSupervisor) {
    return {
      phase: "unavailable",
      detail: "A supervisor is already assigned to this project.",
    };
  }

  if (
    snapshot.requestStatusNorm === "pending" &&
    snapshot.pendingDoctorId != null
  ) {
    if (snapshot.pendingDoctorId === doctorId) {
      return {
        phase: "requested",
        detail: "Request pending — awaiting supervisor approval.",
      };
    }
    return {
      phase: "unavailable",
      detail: "Another supervisor request is already pending.",
    };
  }

  if (local?.phase === "sending") {
    return { phase: "sending", detail: local.detail };
  }
  if (local?.phase === "error") {
    return { phase: "error", detail: local.detail };
  }
  if (local?.phase === "requested") {
    return { phase: "requested", detail: local.detail };
  }

  return { phase: "idle" };
}

export interface AiSupervisorRecommendationsProps {
  uiState: AiSupervisorRecommendUiState;
  items: EnrichedAiSupervisorRow[];
  errorMessage: string | null;
  onRecommend: () => void;
  onRequestSupervisor: (doctorId: number) => void | Promise<void>;
  /** Local per-doctor state (sending / error / optimistic requested). */
  cardRequestByDoctor: Record<number, AiSupervisorCardRequestState>;
  supervisionSnapshot: AiSupervisionSnapshot;
  /** True while any supervisor request is pending (disables primary AI refresh). */
  supervisionPending: boolean;
  /** Owner or leader can run AI and send requests (matches backend rules). */
  canTriggerRecommend: boolean;
  formatDoctorName: (raw: string) => string;
  /** When true, omits outer margin — used inside the shared AI assist group. */
  embedded?: boolean;
}

function normalizeMatchScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score > 0 && score <= 1) return Math.round(score * 100);
  return Math.round(Math.min(100, Math.max(0, score)));
}

/** Merge AI API rows with recommended-supervisor list for display names (no invented names). */
export function enrichAiSupervisorsWithRecommended(
  aiRows: { doctorId: number; matchScore: number; reason: string }[],
  recommended: {
    doctorId: number;
    userId?: number;
    name: string;
    specialization: string | null;
  }[],
): EnrichedAiSupervisorRow[] {
  const map = new Map(recommended.map((s) => [s.doctorId, s]));
  const sorted = [...aiRows].sort((a, b) => b.matchScore - a.matchScore);
  return sorted.map((row) => {
    const r = map.get(row.doctorId);
    const uid =
      typeof r?.userId === "number" && Number.isFinite(r.userId) && r.userId > 0
        ? r.userId
        : row.doctorId;
    return {
      doctorId: row.doctorId,
      doctorUserId: uid,
      matchScore: normalizeMatchScore(row.matchScore),
      reason: row.reason ?? "",
      name: r?.name?.trim() ? r.name.trim() : null,
      specialization: r?.specialization?.trim()
        ? r.specialization.trim()
        : null,
    };
  });
}

const ACTION_ROW_MIN_HEIGHT = 52;

export function AiSupervisorRecommendations({
  uiState,
  items,
  errorMessage,
  onRecommend,
  onRequestSupervisor,
  cardRequestByDoctor,
  supervisionSnapshot,
  supervisionPending,
  canTriggerRecommend,
  formatDoctorName,
  embedded = false,
}: AiSupervisorRecommendationsProps): ReactElement {
  return (
    <AiRecommendationPanel
      title="AI supervisor recommendations"
      subtitle="Ranked matches from your project context and required skills."
      icon={<Sparkles size={15} color="#7c3aed" strokeWidth={2} />}
      actionLabel="Recommend Supervisors"
      loadingTitle="Finding supervisors"
      loadingSub="This may take a few seconds."
      onAction={onRecommend}
      uiState={uiState}
      errorMessage={errorMessage}
      emptyDescription="Try running recommendations again in a few minutes, or adjust your project skills and abstract for a better match."
      canTrigger={canTriggerRecommend}
      actionDisabled={supervisionPending}
      resultCount={items.length}
      resultNoun="supervisor"
      sectionStyle={
        embedded ? { ...aiPanelStyles.sectionDivider } : undefined
      }
    >
      <ul style={S.cardList}>
            {items.map((row, index) => {
              const isBest = index === 0;
              const displayName = row.name
                ? formatDoctorName(row.name)
                : `Supervisor (ID ${row.doctorId})`;
              const merged = mergeAiSupervisorCardRequestState(
                row.doctorId,
                supervisionSnapshot,
                cardRequestByDoctor[row.doctorId],
              );

              return (
                <li
                  key={row.doctorId}
                  style={{
                    ...S.recCard,
                    ...(isBest ? S.recCardBest : {}),
                  }}
                >
                  {isBest && <span style={S.bestAccentBar} aria-hidden />}
                  <div style={S.recCardInner}>
                    <div style={S.recCardTop}>
                      <div style={S.rankCol}>
                        <span
                          style={{
                            ...S.rankBadge,
                            ...(isBest ? S.rankBadgeBest : {}),
                          }}
                        >
                          #{index + 1}
                        </span>
                        {isBest && (
                          <span style={S.bestBadge}>
                            <Star
                              size={11}
                              fill="#15803d"
                              color="#15803d"
                              aria-hidden
                            />
                            Best match
                          </span>
                        )}
                      </div>
                      <div style={S.recMain}>
                        <p style={S.recName}>
                          <ProfileLink userId={row.doctorUserId} role="doctor">{displayName}</ProfileLink>
                        </p>
                        {row.specialization && (
                          <p style={S.recSpec}>{row.specialization}</p>
                        )}
                        <div style={S.scoreRow}>
                          <span style={S.scoreLabel}>Match score</span>
                          <span
                            style={{
                              ...S.scoreValue,
                              ...(isBest ? S.scoreValueBest : {}),
                            }}
                          >
                            {row.matchScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                    {row.reason.trim() !== "" && (
                      <div style={S.reasonBlock}>
                        <p style={S.reasonLabel}>Why this match</p>
                        <p style={S.reason}>{row.reason}</p>
                      </div>
                    )}
                    <div
                      style={{
                        ...S.requestRow,
                        minHeight: ACTION_ROW_MIN_HEIGHT,
                        justifyContent: "center",
                      }}
                    >
                        {merged.phase === "idle" && canTriggerRecommend && (
                          <button
                            type="button"
                            onClick={() => void onRequestSupervisor(row.doctorId)}
                            style={S.requestBtn}
                          >
                            Request
                          </button>
                        )}
                        {merged.phase === "sending" && canTriggerRecommend && (
                          <button
                            type="button"
                            disabled
                            style={{ ...S.requestBtn, ...S.requestBtnDisabled }}
                          >
                            <Loader2
                              size={12}
                              style={{ ...S.spinIcon, marginRight: 6 }}
                              aria-hidden
                            />
                            Sending…
                          </button>
                        )}
                        {merged.phase === "requested" && (
                          <div style={S.statusRequested}>
                            <span style={S.statusRequestedLabel}>Requested</span>
                            {merged.detail && (
                              <p style={S.statusDetail}>{merged.detail}</p>
                            )}
                          </div>
                        )}
                        {merged.phase === "error" && canTriggerRecommend && (
                          <div style={S.statusErrorWrap}>
                            {merged.detail && (
                              <p style={S.statusErrorText}>{merged.detail}</p>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                void onRequestSupervisor(row.doctorId)
                              }
                              style={S.requestBtnSecondary}
                            >
                              Try again
                            </button>
                          </div>
                        )}
                        {merged.phase === "unavailable" && (
                          <div style={S.statusUnavailable}>
                            <span style={S.statusUnavailableLabel}>
                              Unavailable
                            </span>
                            {merged.detail && (
                              <p style={S.statusDetailMuted}>{merged.detail}</p>
                            )}
                          </div>
                        )}
                        {!canTriggerRecommend && merged.phase === "idle" && (
                          <p style={S.memberHint}>
                            Request actions are limited to the project owner or
                            leader.
                          </p>
                        )}
                    </div>
                  </div>
                </li>
              );
            })}
      </ul>
    </AiRecommendationPanel>
  );
}

const wrap: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const S: Record<string, CSSProperties> = {
  block: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid rgba(99,102,241,0.12)",
  },
  blockHeader: { marginBottom: 12 },
  blockTitleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  iconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 10,
    background:
      "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.1))",
    border: "1px solid rgba(99,102,241,0.18)",
    flexShrink: 0,
  },
  blockTitle: {
    margin: 0,
    fontSize: 10,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  blockSub: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.5,
    maxWidth: 520,
    ...wrap,
  },
  hintMuted: {
    margin: "0 0 12px",
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.55,
    ...wrap,
  },
  primaryBtnWrap: {
    marginBottom: 4,
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "9px 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    color: "white",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 14px rgba(99,102,241,0.32)",
    minWidth: 200,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  spinIcon: {
    animation: "aiPanelSpin 0.8s linear infinite",
  },
  loadingBox: {
    marginTop: 14,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 16px",
    background:
      "linear-gradient(135deg,rgba(99,102,241,0.07),rgba(168,85,247,0.05))",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 14,
    boxSizing: "border-box",
    minHeight: 72,
  },
  loadingTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
  },
  loadingSub: {
    margin: "4px 0 0",
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 1.45,
  },
  errorBox: {
    marginTop: 14,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 14,
    boxSizing: "border-box",
    minHeight: 72,
  },
  errorTitle: {
    margin: "0 0 4px",
    fontSize: 12,
    fontWeight: 800,
    color: "#b91c1c",
  },
  errorBody: {
    margin: 0,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.55,
    ...wrap,
  },
  emptyBox: {
    marginTop: 14,
    textAlign: "center",
    padding: "22px 18px",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: 14,
    boxSizing: "border-box",
    minHeight: 120,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#f1f5f9",
    marginBottom: 2,
  },
  emptyTitle: {
    margin: "10px 0 6px",
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
  },
  emptyDesc: {
    margin: 0,
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.55,
    maxWidth: 320,
    ...wrap,
  },
  cardList: {
    margin: "14px 0 0",
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  recCard: {
    position: "relative",
    padding: 0,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  recCardBest: {
    border: "1px solid rgba(34,197,94,0.35)",
    background:
      "linear-gradient(165deg,rgba(240,253,244,0.65) 0%,#ffffff 48%,rgba(238,242,255,0.35) 100%)",
    boxShadow:
      "0 4px 20px rgba(34,197,94,0.1), 0 2px 12px rgba(99,102,241,0.06)",
  },
  bestAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    background: "linear-gradient(180deg,#22c55e,#16a34a)",
    borderRadius: "16px 0 0 16px",
  },
  recCardInner: {
    padding: "16px 16px 16px 18px",
    position: "relative",
  },
  recCardTop: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  rankCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    flexShrink: 0,
  },
  rankBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: "#4f46e5",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    padding: "5px 9px",
    borderRadius: 8,
    minWidth: 36,
    textAlign: "center",
    boxSizing: "border-box",
  },
  rankBadgeBest: {
    color: "#15803d",
    background: "#dcfce7",
    border: "1px solid #86efac",
  },
  bestBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#14532d",
    background: "rgba(220,252,231,0.95)",
    border: "1px solid #86efac",
    padding: "4px 9px",
    borderRadius: 8,
    whiteSpace: "nowrap",
  },
  recMain: {
    minWidth: 0,
    flex: 1,
  },
  recName: {
    margin: "0 0 4px",
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    fontFamily: "Syne, sans-serif",
    lineHeight: 1.3,
    ...wrap,
  },
  recSpec: {
    margin: "0 0 10px",
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.45,
    ...wrap,
  },
  scoreRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 800,
    color: "#16a34a",
    letterSpacing: "-0.02em",
  },
  scoreValueBest: {
    color: "#15803d",
  },
  reasonBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid #f1f5f9",
  },
  reasonLabel: {
    margin: "0 0 6px",
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  reason: {
    margin: 0,
    fontSize: 12,
    color: "#475569",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    ...wrap,
  },
  requestRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    boxSizing: "border-box",
  },
  requestBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    alignSelf: "flex-start",
    minWidth: 160,
    minHeight: 36,
    boxSizing: "border-box",
  },
  requestBtnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 16px",
    borderRadius: 10,
    border: "1.5px solid #c7d2fe",
    background: "white",
    color: "#6366f1",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    alignSelf: "flex-start",
    minWidth: 160,
    minHeight: 36,
    boxSizing: "border-box",
  },
  requestBtnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  statusRequested: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-start",
    justifyContent: "center",
    minHeight: 36,
  },
  statusRequestedLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#15803d",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statusDetail: {
    margin: 0,
    fontSize: 11,
    color: "#475569",
    lineHeight: 1.5,
    maxWidth: "100%",
    ...wrap,
  },
  statusDetailMuted: {
    margin: 0,
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 1.5,
    maxWidth: "100%",
    ...wrap,
  },
  statusErrorWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
  },
  statusErrorText: {
    margin: 0,
    fontSize: 11,
    fontWeight: 600,
    color: "#b91c1c",
    lineHeight: 1.5,
    maxWidth: "100%",
    ...wrap,
  },
  statusUnavailable: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-start",
    justifyContent: "center",
    minHeight: 36,
  },
  statusUnavailableLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  memberHint: {
    margin: 0,
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 1.5,
    ...wrap,
  },
};
