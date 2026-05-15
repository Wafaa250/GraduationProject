import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  mergeAiSupervisorCardRequestState,
  type AiSupervisionSnapshot,
  type AiSupervisorCardRequestState,
  type AiSupervisorRecommendUiState,
  type EnrichedAiSupervisorRow,
} from "@/components/student-dashboard/enrichAiSupervisors";
import { AiRecommendationPanel } from "./AiRecommendationPanel";
import { aiPanelStyles as S } from "./aiRecommendationPanelStyles";

export interface AiSupervisorRecommendationsPanelProps {
  uiState: AiSupervisorRecommendUiState;
  items: EnrichedAiSupervisorRow[];
  errorMessage: string | null;
  onRecommend: () => void;
  onRequestSupervisor: (doctorProfileId: number) => void;
  /** AspNetUsers.Id — e.g. DoctorPublicProfilePage?doctorId= */
  onViewProfile: (doctorUserId: number) => void;
  cardRequestByDoctor: Record<number, AiSupervisorCardRequestState>;
  supervisionSnapshot: AiSupervisionSnapshot;
  supervisionPending: boolean;
  canTriggerRecommend: boolean;
  formatDoctorName: (raw: string) => string;
  embedded?: boolean;
}

export function AiSupervisorRecommendationsPanel({
  uiState,
  items,
  errorMessage,
  onRecommend,
  onRequestSupervisor,
  onViewProfile,
  cardRequestByDoctor,
  supervisionSnapshot,
  supervisionPending,
  canTriggerRecommend,
  formatDoctorName,
  embedded = false,
}: AiSupervisorRecommendationsPanelProps) {
  return (
    <AiRecommendationPanel
      title="AI supervisor recommendations"
      subtitle="Ranked matches from your project context and required skills."
      iconName="sparkles"
      iconColor="#7c3aed"
      actionLabel="Recommend Supervisors"
      loadingTitle="Finding supervisors"
      loadingSub="This may take a few seconds."
      onAction={onRecommend}
      uiState={uiState}
      errorMessage={errorMessage}
      emptyDescription="Try running recommendations again in a few minutes, or adjust your project skills and abstract."
      canTrigger={canTriggerRecommend}
      actionDisabled={supervisionPending}
      resultCount={items.length}
      resultNoun="supervisor"
      sectionStyle={embedded ? S.sectionDivider : undefined}
    >
      <View style={S.cardList}>
        {items.map((row, index) => {
          const isBest = index === 0;
          const displayName = row.name?.trim()
            ? formatDoctorName(row.name)
            : `Supervisor (ID ${row.doctorId})`;
          const merged = mergeAiSupervisorCardRequestState(
            row.doctorId,
            supervisionSnapshot,
            cardRequestByDoctor[row.doctorId],
          );

          return (
            <View
              key={row.doctorId}
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
                    <Text style={S.recName}>{displayName}</Text>
                    {row.specialization ? (
                      <Text style={S.recSpec}>{row.specialization}</Text>
                    ) : null}
                    <View style={S.scoreRow}>
                      <Text style={S.scoreLabel}>Match score</Text>
                      <Text style={[S.scoreValue, isBest && S.scoreValueBest]}>
                        {row.matchScore}%
                      </Text>
                    </View>
                  </View>
                </View>
                {row.reason.trim() !== "" ? (
                  <View style={S.reasonBlock}>
                    <Text style={S.reasonLabel}>Why this match</Text>
                    <Text style={S.reason}>{row.reason}</Text>
                  </View>
                ) : null}
                <View style={S.actionRow}>
                  {merged.phase === "idle" && canTriggerRecommend ? (
                    <Pressable
                      style={S.requestBtn}
                      onPress={() => onRequestSupervisor(row.doctorId)}
                    >
                      <Text style={S.requestBtnText}>Request</Text>
                    </Pressable>
                  ) : null}
                  {merged.phase === "sending" && canTriggerRecommend ? (
                    <Pressable
                      style={[S.requestBtn, S.requestBtnDisabled, { flexDirection: "row", gap: 6 }]}
                      disabled
                    >
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={S.requestBtnText}>Sending…</Text>
                    </Pressable>
                  ) : null}
                  {merged.phase === "requested" ? (
                    <Text style={[S.statusText, S.statusOk]}>
                      {merged.detail ?? "Request pending"}
                    </Text>
                  ) : null}
                  {merged.phase === "error" && canTriggerRecommend ? (
                    <Pressable
                      style={S.inviteBtn}
                      onPress={() => onRequestSupervisor(row.doctorId)}
                    >
                      <Text style={S.inviteBtnText}>Try again</Text>
                    </Pressable>
                  ) : null}
                  {merged.phase === "unavailable" ? (
                    <Text style={S.statusText}>{merged.detail ?? "Unavailable"}</Text>
                  ) : null}
                  {!canTriggerRecommend && merged.phase === "idle" ? (
                    <Text style={S.statusText}>
                      Request actions are limited to the project owner or leader.
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  style={S.outlineLink}
                  onPress={() => onViewProfile(row.doctorUserId)}
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
