import type { CSSProperties, ReactElement } from "react";
import { Loader2, Star, UserPlus, Users } from "lucide-react";
import type { GradProjectRecommendedStudent } from "../../../api/gradProjectApi";
import {
  AiRecommendationPanel,
  type AiRecommendationPanelUiState,
} from "./AiRecommendationPanel";

export interface AiTeammateRecommendationsProps {
  uiState: AiRecommendationPanelUiState;
  students: GradProjectRecommendedStudent[];
  errorMessage: string | null;
  onRecommend: () => void;
  onInvite: (studentId: number) => void | Promise<void>;
  inviteLoadingId: number | null;
  canTrigger: boolean;
  canInvite: boolean;
  teamFull: boolean;
  skillChipStyle: CSSProperties;
}

export function AiTeammateRecommendations({
  uiState,
  students,
  errorMessage,
  onRecommend,
  onInvite,
  inviteLoadingId,
  canTrigger,
  canInvite,
  teamFull,
  skillChipStyle,
}: AiTeammateRecommendationsProps): ReactElement {
  return (
    <AiRecommendationPanel
      title="AI teammate recommendations"
      subtitle="Ranked students who fit your project skills, major, and description."
      icon={<Users size={15} color="#6366f1" strokeWidth={2} />}
      actionLabel="Find Best Teammates (AI)"
      loadingTitle="Finding teammates"
      loadingSub="Matching students to your project profile…"
      onAction={onRecommend}
      uiState={uiState}
      errorMessage={errorMessage}
      emptyTitle="No teammate matches"
      emptyDescription="No students with relevant skills were found for this project. Try adding or adjusting required skills, then run recommendations again."
      canTrigger={canTrigger}
      actionDisabled={teamFull}
      resultCount={students.length}
      resultNoun="match"
    >
      <ul style={T.cardList}>
        {students.map((row, index) => {
          const isBest = index === 0;
          return (
            <li
              key={row.studentId}
              style={{ ...T.recCard, ...(isBest ? T.recCardBest : {}) }}
            >
              {isBest && <span style={T.bestAccentBar} aria-hidden />}
              <div style={T.recCardInner}>
                <div style={T.recCardTop}>
                  <div style={T.rankCol}>
                    <span
                      style={{
                        ...T.rankBadge,
                        ...(isBest ? T.rankBadgeBest : {}),
                      }}
                    >
                      #{index + 1}
                    </span>
                    {isBest && (
                      <span style={T.bestBadge}>
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
                  <div style={T.recMain}>
                    <p style={T.recName}>{row.name}</p>
                    <p style={T.recMeta}>
                      {row.major}
                      {row.university ? ` · ${row.university}` : ""}
                    </p>
                    <div style={T.scoreRow}>
                      <span style={T.scoreLabel}>Match score</span>
                      <span
                        style={{
                          ...T.scoreValue,
                          ...(isBest ? T.scoreValueBest : {}),
                        }}
                      >
                        {row.matchScore}%
                      </span>
                    </div>
                  </div>
                </div>
                {(row.skills?.length ?? 0) > 0 && (
                  <div style={T.skillsRow}>
                    {(row.skills ?? []).slice(0, 6).map((sk) => (
                      <span key={`${row.studentId}-${sk}`} style={skillChipStyle}>
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
                {row.reason?.trim() ? (
                  <div style={T.reasonBlock}>
                    <p style={T.reasonLabel}>Why this match</p>
                    <p style={T.reason}>{row.reason}</p>
                  </div>
                ) : null}
                {canInvite && (
                  <div style={T.actionRow}>
                    <button
                      type="button"
                      onClick={() => void onInvite(row.studentId)}
                      disabled={teamFull || inviteLoadingId === row.studentId}
                      style={{
                        ...T.inviteBtn,
                        ...(teamFull || inviteLoadingId === row.studentId
                          ? T.inviteBtnDisabled
                          : {}),
                      }}
                    >
                      {inviteLoadingId === row.studentId ? (
                        <>
                          <Loader2 size={12} style={T.spin} aria-hidden />
                          Sending…
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} aria-hidden />
                          Invite to team
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </AiRecommendationPanel>
  );
}

const T = buildTeammateStyles();

function buildTeammateStyles(): Record<string, CSSProperties> {
  return {
    cardList: {
      margin: 0,
      padding: 0,
      listStyle: "none",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
    recCard: {
      position: "relative",
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      background: "#fff",
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
    },
    recCardBest: {
      borderColor: "rgba(34,197,94,0.35)",
      boxShadow: "0 4px 16px rgba(34,197,94,0.12)",
    },
    bestAccentBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      background: "linear-gradient(180deg,#22c55e,#16a34a)",
    },
    recCardInner: { padding: "12px 14px 12px 16px" },
    recCardTop: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    },
    rankCol: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      flexShrink: 0,
    },
    rankBadge: {
      fontSize: 11,
      fontWeight: 800,
      color: "#64748b",
      background: "#f1f5f9",
      padding: "4px 8px",
      borderRadius: 8,
    },
    rankBadgeBest: {
      background: "#dcfce7",
      color: "#15803d",
    },
    bestBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 10,
      fontWeight: 700,
      color: "#15803d",
    },
    recMain: { flex: 1, minWidth: 0 },
    recName: {
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      lineHeight: 1.3,
    },
    recMeta: {
      margin: "4px 0 8px",
      fontSize: 12,
      color: "#64748b",
      lineHeight: 1.45,
    },
    scoreRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    scoreLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 600 },
    scoreValue: {
      fontSize: 13,
      fontWeight: 800,
      color: "#6366f1",
    },
    scoreValueBest: { color: "#15803d" },
    skillsRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 10,
    },
    reasonBlock: {
      marginTop: 10,
      padding: "10px 12px",
      background: "#f8fafc",
      borderRadius: 10,
      border: "1px solid #e2e8f0",
    },
    reasonLabel: {
      margin: "0 0 4px",
      fontSize: 10,
      fontWeight: 800,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
    },
    reason: {
      margin: 0,
      fontSize: 12,
      color: "#475569",
      lineHeight: 1.5,
      fontStyle: "italic",
    },
    actionRow: {
      marginTop: 12,
      display: "flex",
      justifyContent: "flex-end",
    },
    inviteBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 10,
      border: "1px solid #c7d2fe",
      background: "#fff",
      color: "#6366f1",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    inviteBtnDisabled: {
      opacity: 0.55,
      cursor: "not-allowed",
    },
    spin: {
      animation: "aiPanelSpin 0.8s linear infinite",
    },
  };
}
