import {
  Check,
  GraduationCap,
  Sparkles,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DoctorSupervisorRequest } from "@/api/doctorDashboardApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { DoctorCompatibilityRing } from "@/components/doctor/supervision/DoctorCompatibilityRing";
import { SupervisionStatusBadge } from "@/components/doctor/supervision/SupervisionStatusBadge";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDoctorHubDate } from "@/lib/doctorHubMappers";
import {
  aiMatchScore,
  aiMatchSummary,
  formatProjectTypeLabel,
  formatSupervisionSubmittedDate,
  normalizeSupervisionStatus,
  requestCodeLabel,
  teamSizeLabel,
} from "@/lib/supervisionRequestUi";

type Props = {
  visible: boolean;
  request: DoctorSupervisorRequest | null;
  busy?: boolean;
  onClose: () => void;
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
};

function DetailSection({
  title,
  children,
  styles,
}: {
  title: string;
  children: ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function SupervisionRequestDetailSheet({
  visible,
  request,
  busy,
  onClose,
  onAccept,
  onReject,
}: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(600);
      fadeAnim.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 26,
        stiffness: 260,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, slideAnim, fadeAnim]);

  if (!request) return null;

  const pending = normalizeSupervisionStatus(request.status) === "pending";
  const normalized = normalizeSupervisionStatus(request.status);
  const score = aiMatchScore(request);
  const skills = request.project.requiredSkills ?? [];
  const roles = request.project.preferredRoles ?? [];
  const members = request.project.members ?? [];
  const stage =
    request.project.stage?.trim() ||
    formatProjectTypeLabel(request.project.projectType, request.sender.faculty, request.sender.major);
  const code = requestCodeLabel(request);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close details" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, DOCTOR_SPACE.lg),
              transform: [{ translateY: slideAnim }],
              maxHeight: layout.height * 0.92,
            },
          ]}
        >
          <View style={styles.sheetChrome}>
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            <View style={styles.headerRow}>
              <FeedAvatar name={request.sender.name} size={52} roleType="student" />
              <View style={styles.headerText}>
                <View style={styles.nameStatusRow}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {request.sender.name}
                  </Text>
                  <SupervisionStatusBadge status={request.status} />
                </View>
                <Text style={styles.requestCode}>{code}</Text>
                <View style={styles.educationRow}>
                  <GraduationCap size={13} color={colors.muted} strokeWidth={2} />
                  <Text style={styles.educationText} numberOfLines={2}>
                    {request.sender.major}
                    {request.sender.academicYear ? ` · ${request.sender.academicYear}` : ""}
                    {request.sender.university ? ` · ${request.sender.university}` : ""}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={16}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <View style={[styles.closeBtnInner, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <X size={18} color={colors.foreground} strokeWidth={2.4} />
              </View>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            style={styles.scroll}
          >
            <View style={styles.projectBlock}>
              <Text style={styles.projectTitle}>{request.project.name}</Text>
              <View style={styles.projectMetaRow}>
                <Text style={styles.metaInline}>
                  {formatProjectTypeLabel(
                    request.project.projectType,
                    request.sender.faculty,
                    request.sender.major,
                  )}
                </Text>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.metaInline}>{stage}</Text>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.metaInline}>{teamSizeLabel(request)} members</Text>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.metaInline}>{formatSupervisionSubmittedDate(request.createdAt)}</Text>
              </View>
            </View>

            {request.project.description?.trim() ? (
              <DetailSection title="Project Description" styles={styles}>
                <Text style={styles.bodyText}>{request.project.description.trim()}</Text>
              </DetailSection>
            ) : null}

            <DetailSection title="Required Skills" styles={styles}>
              {skills.length === 0 ? (
                <Text style={styles.mutedText}>None listed</Text>
              ) : (
                <View style={styles.chipRow}>
                  {skills.map((skill) => (
                    <View key={skill} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              )}
            </DetailSection>

            <DetailSection title="Preferred Roles" styles={styles}>
              {roles.length === 0 ? (
                <Text style={styles.mutedText}>None listed</Text>
              ) : (
                <View style={styles.chipRow}>
                  {roles.map((role) => (
                    <View key={role} style={styles.roleChip}>
                      <Text style={styles.roleChipText}>{role}</Text>
                    </View>
                  ))}
                </View>
              )}
            </DetailSection>

            {members.length > 0 ? (
              <DetailSection title="Team Members" styles={styles}>
                <View style={styles.memberList}>
                  {members.map((member) => (
                    <View key={`${member.studentId}-${member.role}`} style={styles.memberRow}>
                      <FeedAvatar name={member.name} size={34} roleType="student" />
                      <View style={styles.memberText}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberMeta}>
                          {member.role}
                          {member.major ? ` · ${member.major}` : ""}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </DetailSection>
            ) : null}

            <View style={styles.aiCard}>
              <DoctorCompatibilityRing score={score} size={52} />
              <View style={styles.aiText}>
                <View style={styles.aiTitleRow}>
                  <Sparkles size={14} color={colors.primary} strokeWidth={2.2} />
                  <Text style={styles.aiTitle}>AI Compatibility</Text>
                </View>
                <Text style={styles.aiSummary}>{aiMatchSummary(request)}</Text>
              </View>
            </View>

            {request.respondedAt ? (
              <DetailSection title="Response" styles={styles}>
                <Text style={styles.bodyText}>
                  {normalized === "accepted" ? "You accepted this request" : "You rejected this request"} on{" "}
                  {formatDoctorHubDate(request.respondedAt)}.
                </Text>
                {request.doctorResponseNote?.trim() ? (
                  <Text style={[styles.bodyText, { marginTop: DOCTOR_SPACE.sm }]}>
                    {request.doctorResponseNote.trim()}
                  </Text>
                ) : null}
              </DetailSection>
            ) : null}

            {request.history && request.history.length > 0 ? (
              <DetailSection title="Activity" styles={styles}>
                {request.history.map((item, index) => (
                  <View key={`${item.event}-${item.at}-${index}`} style={styles.historyRow}>
                    <View style={styles.historyDot} />
                    <View style={styles.historyText}>
                      <Text style={styles.historyEvent}>{item.event}</Text>
                      <Text style={styles.historyDate}>{formatDoctorHubDate(item.at)}</Text>
                    </View>
                  </View>
                ))}
              </DetailSection>
            ) : null}
          </ScrollView>

          {pending ? (
            <View style={styles.actions}>
              <Pressable
                onPress={() => onReject(request.requestId)}
                disabled={busy}
                style={({ pressed }) => [
                  styles.rejectBtn,
                  { opacity: busy ? 0.65 : pressed ? 0.92 : 1 },
                ]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <X size={18} color="#EF4444" strokeWidth={2.5} />
                    <Text style={styles.rejectText}>Reject Request</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={() => onAccept(request.requestId)}
                disabled={busy}
                style={({ pressed }) => [
                  styles.acceptBtn,
                  { backgroundColor: colors.primary, opacity: busy ? 0.65 : pressed ? 0.92 : 1 },
                ]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.acceptText}>Accept Request</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.closedBanner}>
              <Text style={styles.closedText}>
                {normalized === "accepted" ? "Supervision is active for this project." : "This request is closed."}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 23, 42, 0.45)",
    },
    sheet: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: DOCTOR_RADIUS.xl,
      borderTopRightRadius: DOCTOR_RADIUS.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderBottomWidth: 0,
      overflow: "hidden",
    },
    sheetChrome: {
      position: "relative",
      zIndex: 2,
      elevation: 2,
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingBottom: DOCTOR_SPACE.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    handleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: DOCTOR_SPACE.sm,
      paddingBottom: DOCTOR_SPACE.xs,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    closeBtn: {
      position: "absolute",
      right: DOCTOR_SPACE.lg,
      top: DOCTOR_SPACE.md,
      zIndex: 10,
      elevation: 10,
    },
    closeBtnInner: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
    },
    scroll: {
      flexShrink: 1,
    },
    scrollContent: {
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.md,
      paddingBottom: DOCTOR_SPACE.lg,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: DOCTOR_SPACE.sm,
      paddingRight: 40,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    nameStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: DOCTOR_SPACE.sm,
    },
    studentName: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.foreground,
      letterSpacing: -0.2,
      flexShrink: 1,
    },
    requestCode: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
      marginTop: 2,
      fontVariant: ["tabular-nums"],
    },
    educationRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 4,
      marginTop: 6,
    },
    educationText: {
      flex: 1,
      fontSize: 12,
      color: colors.muted,
      fontWeight: "500",
      lineHeight: 17,
    },
    projectBlock: {
      paddingBottom: DOCTOR_SPACE.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    projectTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      lineHeight: 22,
      letterSpacing: -0.15,
    },
    projectMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
    },
    metaSep: {
      color: colors.muted,
      opacity: 0.4,
      fontSize: 11,
    },
    metaInline: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: "500",
    },
    section: {
      marginTop: DOCTOR_SPACE.md,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      marginBottom: DOCTOR_SPACE.sm,
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.foreground,
      fontWeight: "500",
    },
    mutedText: {
      fontSize: 13,
      color: colors.muted,
      fontWeight: "500",
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    skillChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
    },
    skillChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.foreground,
    },
    roleChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    roleChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
    },
    memberList: {
      gap: DOCTOR_SPACE.sm,
    },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
    },
    memberText: {
      flex: 1,
      minWidth: 0,
    },
    memberName: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
    },
    memberMeta: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 1,
      fontWeight: "500",
    },
    aiCard: {
      marginTop: DOCTOR_SPACE.md,
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
      padding: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.primarySoft,
    },
    aiText: {
      flex: 1,
      minWidth: 0,
    },
    aiTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    aiTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    aiSummary: {
      fontSize: 13,
      color: colors.foreground,
      marginTop: 4,
      lineHeight: 18,
      fontWeight: "500",
    },
    historyRow: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      marginBottom: DOCTOR_SPACE.sm,
    },
    historyDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginTop: 5,
    },
    historyText: {
      flex: 1,
    },
    historyEvent: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
    historyDate: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
      fontWeight: "500",
    },
    actions: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    rejectBtn: {
      flex: 1,
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.35)",
      backgroundColor: "rgba(239, 68, 68, 0.08)",
    },
    rejectText: {
      fontSize: 15,
      fontWeight: "800",
      color: "#EF4444",
    },
    acceptBtn: {
      flex: 1,
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: DOCTOR_RADIUS.md,
    },
    acceptText: {
      fontSize: 15,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    closedBanner: {
      marginHorizontal: DOCTOR_SPACE.lg,
      marginTop: DOCTOR_SPACE.md,
      paddingVertical: DOCTOR_SPACE.md,
      paddingHorizontal: DOCTOR_SPACE.lg,
      borderRadius: DOCTOR_RADIUS.md,
      backgroundColor: colors.inputBg,
      alignItems: "center",
    },
    closedText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textAlign: "center",
    },
  });
}
