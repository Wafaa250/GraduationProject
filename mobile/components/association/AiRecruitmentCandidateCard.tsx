import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { FileText, User } from "lucide-react-native";

import type { RecruitmentApplicantAnalysisResult } from "@/api/recruitmentApplicationsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { associationRecruitmentApplicationPath } from "@/lib/associationRoutes";
import { studentDirectoryProfilePath } from "@/lib/studentRoutes";

export type AiRecruitmentCardVariant = "suggested" | "accepted" | "rejected";

type Props = {
  campaignId: number;
  result: RecruitmentApplicantAnalysisResult;
  variant: AiRecruitmentCardVariant;
  showBestPick?: boolean;
  busy?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
};

export function AiRecruitmentCandidateCard({
  campaignId,
  result: r,
  variant,
  showBestPick,
  busy,
  onAccept,
  onReject,
}: Props) {
  const cardStyle =
    variant === "accepted"
      ? styles.cardAccepted
      : variant === "rejected"
        ? styles.cardRejected
        : undefined;

  return (
    <AssociationCard compact style={cardStyle}>
      <View style={styles.topRow}>
        <View style={styles.badges}>
          {showBestPick ? <Text style={styles.bestPick}>Best match</Text> : null}
          <Text
            style={
              variant === "accepted"
                ? styles.badgeAccepted
                : variant === "rejected"
                  ? styles.badgeRejected
                  : styles.badgeSuggested
            }
          >
            {variant === "accepted" ? "Accepted" : variant === "rejected" ? "Rejected" : "AI Suggested"}
          </Text>
        </View>
        {variant !== "accepted" ? (
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreNum}>{r.matchScore}%</Text>
            <Text style={styles.scoreLbl}>Match</Text>
          </View>
        ) : (
          <Text style={styles.acceptedNote}>Added to organization</Text>
        )}
      </View>

      <Text style={styles.name}>{r.studentName}</Text>
      <Text style={styles.meta}>{[r.faculty, r.major].filter(Boolean).join(" · ") || "—"}</Text>

      {variant !== "accepted" && r.strengths.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLbl}>Strengths</Text>
          <View style={styles.tagRow}>
            {r.strengths.map((s) => (
              <Text key={s} style={styles.strengthTag}>
                {s}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {variant !== "accepted" && r.concerns.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLbl}>Concerns</Text>
          {r.concerns.map((c) => (
            <Text key={c} style={styles.concern}>
              • {c}
            </Text>
          ))}
        </View>
      ) : null}

      {variant !== "accepted" ? (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLbl}>Why this student</Text>
          <Text style={styles.reasonText}>{r.reason}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {r.studentUserId > 0 ? (
          <AssociationActionButton
            label="View profile"
            variant="outline"
            compact
            icon={<User size={14} color={ASSOC_COLORS.accentDark} strokeWidth={2.25} />}
            onPress={() => router.push(studentDirectoryProfilePath(r.studentUserId) as Href)}
          />
        ) : null}
        <AssociationActionButton
          label="View application"
          variant="outline"
          compact
          icon={<FileText size={14} color={ASSOC_COLORS.accentDark} strokeWidth={2.25} />}
          onPress={() =>
            router.push(
              associationRecruitmentApplicationPath(campaignId, r.applicationId, r.studentUserId) as Href,
            )
          }
        />
        {variant === "suggested" && onAccept ? (
          <AssociationActionButton label="Accept" compact loading={busy} onPress={onAccept} />
        ) : null}
        {variant === "suggested" && onReject ? (
          <AssociationActionButton label="Reject" variant="danger" compact loading={busy} onPress={onReject} />
        ) : null}
      </View>
    </AssociationCard>
  );
}

const styles = StyleSheet.create({
  cardAccepted: {
    borderColor: ASSOC_COLORS.successBorder,
    backgroundColor: ASSOC_COLORS.successMuted,
  },
  cardRejected: { opacity: 0.65 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  bestPick: {
    fontSize: 11,
    fontWeight: "800",
    color: ASSOC_COLORS.accentInk,
    backgroundColor: ASSOC_COLORS.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeSuggested: {
    fontSize: 11,
    fontWeight: "700",
    color: ASSOC_COLORS.accentDark,
    backgroundColor: ASSOC_COLORS.accentMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeAccepted: {
    fontSize: 11,
    fontWeight: "700",
    color: ASSOC_COLORS.success,
    backgroundColor: ASSOC_COLORS.successMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeRejected: {
    fontSize: 11,
    fontWeight: "700",
    color: ASSOC_COLORS.muted,
    backgroundColor: ASSOC_COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  scoreBlock: { alignItems: "center" },
  scoreNum: { fontSize: 20, fontWeight: "800", color: ASSOC_COLORS.accentDark },
  scoreLbl: { fontSize: 10, color: ASSOC_COLORS.muted, fontWeight: "600" },
  acceptedNote: { fontSize: 12, color: ASSOC_COLORS.success, fontWeight: "700" },
  name: { fontWeight: "800", fontSize: 16, color: ASSOC_COLORS.foreground },
  meta: { color: ASSOC_COLORS.muted, fontSize: 12, marginTop: 2 },
  section: { marginTop: 10 },
  sectionLbl: { fontSize: 11, fontWeight: "700", color: ASSOC_COLORS.muted, marginBottom: 4 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  strengthTag: {
    fontSize: 11,
    fontWeight: "600",
    color: ASSOC_COLORS.accentDark,
    backgroundColor: ASSOC_COLORS.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  concern: { fontSize: 12, color: ASSOC_COLORS.muted, lineHeight: 18 },
  reasonBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: ASSOC_COLORS.background,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
  },
  reasonLbl: { fontSize: 11, fontWeight: "700", color: ASSOC_COLORS.muted, marginBottom: 4 },
  reasonText: { fontSize: 13, color: ASSOC_COLORS.foreground, lineHeight: 18 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
});
