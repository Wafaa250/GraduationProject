import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { GradProjectRecommendedStudent } from "@/api/gradProjectApi";
import {
  AiRecommendationPanel,
  type AiRecommendationPanelUiState,
} from "./AiRecommendationPanel";
import { aiPanelStyles as S } from "./aiRecommendationPanelStyles";

export interface AiTeammateRecommendationsProps {
  uiState: AiRecommendationPanelUiState;
  students: GradProjectRecommendedStudent[];
  errorMessage: string | null;
  onRecommend: () => void;
  onInvite: (studentId: number) => void;
  inviteLoadingId: number | null;
  canTrigger: boolean;
  canInvite: boolean;
  teamFull: boolean;
  onViewProfile: (studentId: number) => void;
  skillChipStyle: {
    paddingHorizontal: number;
    paddingVertical: number;
    borderRadius: number;
    backgroundColor: string;
  };
  skillChipTextStyle: { fontSize: number; color: string; fontWeight: "600" | "700" };
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
  onViewProfile,
  skillChipStyle,
  skillChipTextStyle,
}: AiTeammateRecommendationsProps) {
  return (
    <AiRecommendationPanel
      title="AI teammate recommendations"
      subtitle="Ranked students who fit your project skills, major, and description."
      iconName="people"
      iconColor="#6366f1"
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
      <View style={S.cardList}>
        {students.map((row, index) => {
          const isBest = index === 0;
          const busy = inviteLoadingId === row.studentId;
          return (
            <View
              key={row.studentId}
              style={[S.recCard, isBest && S.recCardBest]}
            >
              {isBest ? <View style={S.bestAccentBar} /> : null}
              <View style={S.recCardInner}>
                <View style={S.recCardTop}>
                  <View style={S.rankCol}>
                    <Text style={[S.rankBadge, isBest && S.rankBadgeBest]}>
                      #{index + 1}
                    </Text>
                    {isBest ? (
                      <Text style={S.bestBadge}>★ Best match</Text>
                    ) : null}
                  </View>
                  <View style={S.recMain}>
                    <Text style={S.recName}>{row.name}</Text>
                    <Text style={S.recMeta}>
                      {row.major}
                      {row.university ? ` · ${row.university}` : ""}
                    </Text>
                    <View style={S.scoreRow}>
                      <Text style={S.scoreLabel}>Match score</Text>
                      <Text style={[S.scoreValue, isBest && S.scoreValueBest]}>
                        {row.matchScore}%
                      </Text>
                    </View>
                  </View>
                </View>
                {(row.skills?.length ?? 0) > 0 ? (
                  <View style={S.skillsRow}>
                    {(row.skills ?? []).slice(0, 6).map((sk) => (
                      <View key={`${row.studentId}-${sk}`} style={skillChipStyle}>
                        <Text style={skillChipTextStyle}>{sk}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {row.reason?.trim() ? (
                  <View style={S.reasonBlock}>
                    <Text style={S.reasonLabel}>Why this match</Text>
                    <Text style={S.reason}>{row.reason}</Text>
                  </View>
                ) : null}
                {canInvite ? (
                  <View style={S.actionRow}>
                    <Pressable
                      onPress={() => onInvite(row.studentId)}
                      disabled={teamFull || busy}
                      style={[
                        S.inviteBtn,
                        (teamFull || busy) && S.inviteBtnDisabled,
                      ]}
                    >
                      {busy ? (
                        <>
                          <ActivityIndicator size="small" color="#6366f1" />
                          <Text style={S.inviteBtnText}>Sending…</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="person-add-outline" size={14} color="#6366f1" />
                          <Text style={S.inviteBtnText}>Invite to team</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                ) : null}
                <Pressable
                  style={S.outlineLink}
                  onPress={() => onViewProfile(row.studentId)}
                >
                  <Text style={S.outlineLinkText}>View profile</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </AiRecommendationPanel>
  );
}
