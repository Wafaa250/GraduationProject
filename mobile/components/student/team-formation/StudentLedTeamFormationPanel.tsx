import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  AiTeamRecommendation,
  CourseEnrollmentStudent,
  ManualTeamStudent,
  TeamInvitationItem,
} from "@/api/studentCoursesApi";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { initialsFromName } from "@/lib/studentManageCourses";
import {
  INVITE_STATUS_LABEL,
  matchScoreBadgeColors,
  parseMatchReasonBullets,
  resolveStudentInviteStatus,
  sectionBadgeColors,
  type StudentInviteStatus,
} from "@/lib/teamFormationPresentation";

type Props = {
  roster: ManualTeamStudent[];
  aiSuggestions: AiTeamRecommendation[];
  aiLoaded: boolean;
  aiLoading: boolean;
  receivedInvites: TeamInvitationItem[];
  sentPending: ManualTeamStudent[];
  enrollmentByStudentId: Record<number, CourseEnrollmentStudent>;
  inviteBusyId: number | null;
  invitationBusyId: number | null;
  onGenerateAi: () => void;
  onInvite: (receiverId: number) => void;
  onAcceptInvite: (invitationId: number) => void;
  onRejectInvite: (invitationId: number) => void;
};

export function StudentLedTeamFormationPanel({
  roster,
  aiSuggestions,
  aiLoaded,
  aiLoading,
  receivedInvites,
  sentPending,
  enrollmentByStudentId,
  inviteBusyId,
  invitationBusyId,
  onGenerateAi,
  onInvite,
  onAcceptInvite,
  onRejectInvite,
}: Props) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ gap: layout.space("lg") }}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Find teammates</Text>
            <Text style={styles.sectionDesc}>
              Browse classmates and send invitations to build your team.
            </Text>
          </View>
          <Pressable
            style={[styles.aiBtn, { borderRadius: layout.radius.input }]}
            disabled={aiLoading}
            onPress={onGenerateAi}
          >
            {aiLoading ? (
              <ActivityIndicator size="small" color={HUB_COLORS.primary} />
            ) : (
              <Ionicons name="sparkles" size={16} color={HUB_COLORS.primary} />
            )}
            <Text style={styles.aiBtnText}>AI suggestions</Text>
          </Pressable>
        </View>

        {roster.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No eligible classmates"
            description="There are no classmates available for this project right now. Check back later or ask your instructor."
          />
        ) : (
          <View style={{ gap: layout.space("sm") }}>
            {roster.map((student) => (
              <StudentCard
                key={student.id}
                name={student.name}
                major={enrollmentByStudentId[student.id]?.major?.trim() || "—"}
                sectionName={student.sectionName}
                skills={student.skills}
                status={resolveStudentInviteStatus(student)}
                busy={inviteBusyId === student.id}
                onInvite={() => onInvite(student.id)}
              />
            ))}
          </View>
        )}
      </View>

      {aiLoaded ? (
        <View style={[styles.section, styles.aiSection]}>
          <View style={styles.aiBadgeRow}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color={HUB_COLORS.primary} />
              <Text style={styles.aiBadgeText}>AI RECOMMENDED</Text>
            </View>
            <Text style={styles.sectionTitle}>Recommended teammates</Text>
          </View>

          {aiSuggestions.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No recommended teammates"
              description="AI could not find strong matches right now. Try browsing available students or generate suggestions again later."
              compact
            />
          ) : (
            <View style={{ gap: layout.space("sm") }}>
              {aiSuggestions.map((rec) => (
                <AiCard
                  key={rec.studentId}
                  recommendation={rec}
                  major={
                    rec.major?.trim() ||
                    enrollmentByStudentId[rec.studentId]?.major?.trim() ||
                    "—"
                  }
                  status={resolveStudentInviteStatus(rec)}
                  busy={inviteBusyId === rec.studentId}
                  onInvite={() => onInvite(rec.studentId)}
                />
              ))}
            </View>
          )}
        </View>
      ) : null}

      <View style={[styles.section, styles.receivedSection]}>
        <View style={styles.sectionIconRow}>
          <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="mail-outline" size={20} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Received invitations</Text>
            <Text style={styles.sectionDesc}>
              Teammates who invited you to join their project team.
            </Text>
          </View>
        </View>

        {receivedInvites.length === 0 ? (
          <EmptyState
            icon="file-tray-outline"
            title="No invitations received"
            description="When a classmate invites you to their team, it will appear here with accept and decline options."
            compact
          />
        ) : (
          <View style={{ gap: layout.space("sm") }}>
            {receivedInvites.map((inv) => (
              <ReceivedInviteCard
                key={inv.invitationId}
                invite={inv}
                major={enrollmentByStudentId[inv.senderId]?.major?.trim() || "—"}
                busy={invitationBusyId === inv.invitationId}
                onAccept={() => onAcceptInvite(inv.invitationId)}
                onReject={() => onRejectInvite(inv.invitationId)}
              />
            ))}
          </View>
        )}
      </View>

      <View style={[styles.section, styles.pendingSection]}>
        <View style={styles.sectionIconRow}>
          <View style={[styles.iconBox, { backgroundColor: "#FFF7ED" }]}>
            <Ionicons name="time-outline" size={20} color="#EA580C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Pending invitations you sent</Text>
            <Text style={styles.sectionDesc}>
              Waiting for classmates to respond to your team invitations.
            </Text>
          </View>
        </View>

        {sentPending.length === 0 ? (
          <EmptyState
            icon="send-outline"
            title="No pending invitations"
            description="Invitations you send will appear here while you wait for a response."
            compact
          />
        ) : (
          <View style={{ gap: layout.space("sm") }}>
            {sentPending.map((student) => (
              <View key={student.id} style={styles.pendingCard}>
                <Avatar name={student.name} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.cardName}>{student.name}</Text>
                  <SectionBadge sectionName={student.sectionName} />
                  <StatusChip status="pending" />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initialsFromName(name)}</Text>
    </View>
  );
}

function SectionBadge({ sectionName }: { sectionName: string }) {
  const colors = sectionBadgeColors(sectionName);
  return (
    <View style={[styles.sectionBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.sectionBadgeText, { color: colors.text }]}>{sectionName}</Text>
    </View>
  );
}

function StatusChip({ status }: { status: StudentInviteStatus }) {
  return <Text style={styles.statusChip}>{INVITE_STATUS_LABEL[status]}</Text>;
}

function MatchScoreBadge({ score }: { score: number }) {
  const colors = matchScoreBadgeColors(score);
  return (
    <View style={[styles.matchBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.matchBadgeText, { color: colors.text }]}>{score}% match</Text>
    </View>
  );
}

function InviteAction({
  status,
  busy,
  onInvite,
}: {
  status: StudentInviteStatus;
  busy: boolean;
  onInvite: () => void;
}) {
  if (status === "in-team") {
    return <Text style={styles.mutedAction}>On your team</Text>;
  }
  if (status === "pending") {
    return (
      <View style={styles.pendingRow}>
        <Ionicons name="time-outline" size={14} color="#EA580C" />
        <Text style={styles.pendingText}>Invitation pending</Text>
      </View>
    );
  }
  if (status === "unavailable") {
    return <Text style={styles.mutedAction}>Unavailable</Text>;
  }
  return (
    <Pressable
      style={[styles.inviteBtn, busy && styles.inviteBtnDisabled]}
      disabled={busy}
      onPress={onInvite}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name="person-add-outline" size={14} color="#FFFFFF" />
          <Text style={styles.inviteBtnText}>Invite</Text>
        </>
      )}
    </Pressable>
  );
}

function StudentCard({
  name,
  major,
  sectionName,
  skills,
  status,
  busy,
  onInvite,
}: {
  name: string;
  major: string;
  sectionName: string;
  skills: string[];
  status: StudentInviteStatus;
  busy: boolean;
  onInvite: () => void;
}) {
  const disabled = status === "in-team" || status === "unavailable";
  return (
    <View style={[styles.card, disabled && styles.cardMuted]}>
      <Avatar name={name} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{name}</Text>
            <Text style={styles.cardMajor}>{major}</Text>
          </View>
          <StatusChip status={status} />
        </View>
        <SectionBadge sectionName={sectionName} />
        {skills.length > 0 ? (
          <View style={styles.skillRow}>
            {skills.slice(0, 4).map((s) => (
              <Text key={s} style={styles.skillChip}>
                {s}
              </Text>
            ))}
            {skills.length > 4 ? (
              <Text style={styles.skillMore}>+{skills.length - 4}</Text>
            ) : null}
          </View>
        ) : null}
        <InviteAction status={status} busy={busy} onInvite={onInvite} />
      </View>
    </View>
  );
}

function AiCard({
  recommendation,
  major,
  status,
  busy,
  onInvite,
}: {
  recommendation: AiTeamRecommendation;
  major: string;
  status: StudentInviteStatus;
  busy: boolean;
  onInvite: () => void;
}) {
  const bullets = useMemo(
    () => parseMatchReasonBullets(recommendation.matchReason, recommendation.skills.length),
    [recommendation.matchReason, recommendation.skills.length],
  );

  return (
    <View style={[styles.card, styles.aiCard]}>
      <Avatar name={recommendation.name} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{recommendation.name}</Text>
            <Text style={styles.cardMajor}>{major}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <MatchScoreBadge score={recommendation.matchScore} />
            <StatusChip status={status} />
          </View>
        </View>
        <SectionBadge sectionName={recommendation.sectionName} />
        {bullets.length > 0 ? (
          <View style={styles.reasonBox}>
            {bullets.map((line) => (
              <View key={line} style={styles.reasonRow}>
                <Ionicons name="checkmark" size={12} color="#16A34A" />
                <Text style={styles.reasonText}>{line}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {recommendation.skills.length > 0 ? (
          <View style={styles.skillRow}>
            {recommendation.skills.slice(0, 5).map((s) => (
              <Text key={s} style={styles.skillChip}>
                {s}
              </Text>
            ))}
          </View>
        ) : null}
        <InviteAction status={status} busy={busy} onInvite={onInvite} />
      </View>
    </View>
  );
}

function ReceivedInviteCard({
  invite,
  major,
  busy,
  onAccept,
  onReject,
}: {
  invite: TeamInvitationItem;
  major: string;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.receivedCard}>
      <View style={styles.receivedTop}>
        <Avatar name={invite.senderName} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.cardName}>{invite.senderName}</Text>
          <Text style={styles.cardMajor}>{major}</Text>
          <SectionBadge sectionName={invite.senderSection} />
          <Text style={styles.inviteMeta}>
            Project: {invite.projectTitle} · Received {formatInviteDate(invite.invitedAt)}
          </Text>
          {invite.message?.trim() ? (
            <Text style={styles.inviteMessage}>&ldquo;{invite.message.trim()}&rdquo;</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.inviteActions}>
        <Pressable
          style={[styles.acceptBtn, busy && styles.inviteBtnDisabled]}
          disabled={busy}
          onPress={onAccept}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              <Text style={styles.inviteBtnText}>Accept</Text>
            </>
          )}
        </Pressable>
        <Pressable
          style={[styles.declineBtn, busy && styles.inviteBtnDisabled]}
          disabled={busy}
          onPress={onReject}
        >
          <Ionicons name="close" size={14} color="#DC2626" />
          <Text style={styles.declineBtnText}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  description,
  compact,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.empty, compact && styles.emptyCompact]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={24} color={HUB_COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{description}</Text>
    </View>
  );
}

function formatInviteDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 16,
    backgroundColor: HUB_COLORS.cardBg,
    padding: 16,
    gap: 14,
  },
  aiSection: {
    borderColor: "rgba(99, 102, 241, 0.25)",
    backgroundColor: "rgba(238, 242, 255, 0.35)",
  },
  receivedSection: {
    borderColor: "rgba(59, 130, 246, 0.35)",
  },
  pendingSection: {
    borderColor: "rgba(234, 88, 12, 0.35)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  sectionIconRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: HUB_COLORS.foreground,
  },
  sectionDesc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: HUB_COLORS.muted,
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    backgroundColor: "rgba(238, 242, 255, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  aiBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: HUB_COLORS.primary,
  },
  aiBadgeRow: {
    gap: 8,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.25)",
    backgroundColor: "rgba(238, 242, 255, 0.8)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: HUB_COLORS.primary,
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    borderRadius: 12,
    backgroundColor: HUB_COLORS.background,
    padding: 12,
  },
  aiCard: {
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  cardMuted: {
    opacity: 0.75,
  },
  cardTop: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  cardName: {
    fontWeight: "700",
    fontSize: 15,
    color: HUB_COLORS.foreground,
  },
  cardMajor: {
    fontSize: 12,
    color: HUB_COLORS.muted,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HUB_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  sectionBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusChip: {
    fontSize: 10,
    fontWeight: "700",
    color: HUB_COLORS.muted,
    textTransform: "uppercase",
  },
  matchBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  skillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillChip: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: HUB_COLORS.border,
    color: HUB_COLORS.muted,
  },
  skillMore: {
    fontSize: 10,
    color: HUB_COLORS.muted,
    alignSelf: "center",
  },
  reasonBox: {
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.15)",
    backgroundColor: "rgba(238, 242, 255, 0.5)",
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  reasonRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  reasonText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: HUB_COLORS.foreground,
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: HUB_COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 88,
  },
  inviteBtnDisabled: {
    opacity: 0.6,
  },
  inviteBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  mutedAction: {
    fontSize: 12,
    fontWeight: "600",
    color: HUB_COLORS.muted,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EA580C",
  },
  receivedCard: {
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.35)",
    backgroundColor: "rgba(239, 246, 255, 0.4)",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  receivedTop: {
    flexDirection: "row",
    gap: 12,
  },
  inviteMeta: {
    fontSize: 11,
    color: HUB_COLORS.muted,
    marginTop: 4,
  },
  inviteMessage: {
    fontSize: 12,
    fontStyle: "italic",
    color: HUB_COLORS.muted,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#16A34A",
    borderRadius: 8,
    paddingVertical: 10,
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingVertical: 10,
  },
  declineBtnText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 13,
  },
  pendingCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.3)",
    backgroundColor: "rgba(255, 247, 237, 0.5)",
    borderRadius: 12,
    padding: 12,
  },
  empty: {
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: HUB_COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 8,
  },
  emptyCompact: {
    paddingVertical: 20,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: HUB_COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: HUB_COLORS.foreground,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: HUB_COLORS.muted,
    textAlign: "center",
    maxWidth: 280,
  },
});
