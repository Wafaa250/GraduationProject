import { Crown, MessageCircle, Users2, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { CourseTeam } from "@/api/doctorCoursesApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getTeamColorTheme } from "@/lib/courseTeamColors";
import { getTeamLeadMemberId } from "@/lib/courseTeamMembers";
import { openCourseTeamChat } from "@/lib/openCourseTeamChat";

type Props = {
  visible: boolean;
  team: CourseTeam | null;
  projectTitle: string;
  onClose: () => void;
};

export function TeamDetailSheet({ visible, team, projectTitle, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [openingChat, setOpeningChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      return;
    }

    setError(null);
    setOpeningChat(false);

    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 24, stiffness: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, slideAnim, fadeAnim]);

  if (!team) return null;

  const theme = getTeamColorTheme(team.teamIndex);
  const leadId = getTeamLeadMemberId(team.members);
  const teamName = `Team ${team.teamIndex + 1}`;

  const handleOpenChat = async () => {
    setOpeningChat(true);
    setError(null);
    try {
      await openCourseTeamChat(team.teamId, (href) => router.push(href as never));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open team chat.");
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, DOCTOR_SPACE.lg),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={[styles.sheetTitle, { fontSize: layout.scale(18) }]}>{teamName}</Text>
              <Text style={[styles.sheetSubtitle, { fontSize: layout.scale(12) }]} numberOfLines={1}>
                {projectTitle}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <X size={20} color={colors.foreground} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={[styles.summary, { borderLeftColor: theme.accent, backgroundColor: theme.soft }]}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.soft }]}>
              <Users2 size={22} color={theme.accent} strokeWidth={2} />
            </View>
            <View>
              <Text style={[styles.summaryTitle, { fontSize: layout.scale(14) }]}>{teamName}</Text>
              <Text style={[styles.summaryMeta, { fontSize: layout.scale(12) }]}>
                {team.memberCount} member{team.memberCount === 1 ? "" : "s"} · {theme.label} team
              </Text>
            </View>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {team.members.length === 0 ? (
              <Text style={[styles.emptyText, { fontSize: layout.scale(13) }]}>
                This team has no members yet.
              </Text>
            ) : (
              team.members.map((member) => {
                const isLead = member.studentId === leadId;
                return (
                  <View
                    key={member.studentId}
                    style={[styles.memberCard, isLead && { borderColor: theme.accent }]}
                  >
                    <FeedAvatar name={member.name} size={40} roleType="student" />
                    <View style={styles.memberBody}>
                      <View style={styles.memberTitleRow}>
                        <Text style={[styles.memberName, { fontSize: layout.scale(14) }]}>{member.name}</Text>
                        {isLead ? (
                          <View style={[styles.leadBadge, { backgroundColor: theme.soft }]}>
                            <Crown size={10} color={theme.accent} strokeWidth={2} />
                            <Text style={[styles.leadBadgeText, { color: theme.accent, fontSize: layout.scale(9) }]}>
                              TEAM LEAD
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {member.universityId ? (
                        <Text style={[styles.memberMeta, { fontSize: layout.scale(11) }]}>
                          {member.universityId}
                        </Text>
                      ) : null}
                      {typeof member.matchScore === "number" ? (
                        <Text style={[styles.memberMeta, { fontSize: layout.scale(11) }]}>
                          Match score: {member.matchScore}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {error ? <Text style={[styles.errorText, { fontSize: layout.scale(12) }]}>{error}</Text> : null}

          <Pressable
            onPress={() => void handleOpenChat()}
            disabled={openingChat}
            style={({ pressed }) => [
              styles.chatBtn,
              { backgroundColor: colors.primary, opacity: pressed || openingChat ? 0.9 : 1 },
            ]}
          >
            {openingChat ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MessageCircle size={18} color="#fff" strokeWidth={2} />
                <Text style={[styles.chatBtnText, { fontSize: layout.scale(14) }]}>Open team chat</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      maxHeight: "88%",
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: DOCTOR_RADIUS.xl,
      borderTopRightRadius: DOCTOR_RADIUS.xl,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.lg,
      paddingBottom: DOCTOR_SPACE.sm,
    },
    sheetHeaderText: {
      flex: 1,
      paddingRight: DOCTOR_SPACE.md,
    },
    sheetTitle: {
      fontWeight: "800",
      color: colors.foreground,
    },
    sheetSubtitle: {
      marginTop: 4,
      fontWeight: "500",
      color: colors.muted,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: DOCTOR_RADIUS.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    summary: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.md,
      marginHorizontal: DOCTOR_SPACE.lg,
      marginBottom: DOCTOR_SPACE.md,
      padding: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.md,
      borderLeftWidth: 3,
    },
    summaryIcon: {
      width: 44,
      height: 44,
      borderRadius: DOCTOR_RADIUS.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryTitle: {
      fontWeight: "800",
      color: colors.foreground,
    },
    summaryMeta: {
      marginTop: 2,
      fontWeight: "500",
      color: colors.muted,
    },
    scroll: {
      maxHeight: 360,
    },
    scrollContent: {
      paddingHorizontal: DOCTOR_SPACE.lg,
      gap: DOCTOR_SPACE.sm,
      paddingBottom: DOCTOR_SPACE.md,
    },
    emptyText: {
      fontWeight: "500",
      color: colors.muted,
      textAlign: "center",
      paddingVertical: DOCTOR_SPACE.lg,
    },
    memberCard: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.md,
      padding: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    memberBody: {
      flex: 1,
      minWidth: 0,
    },
    memberTitleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
    },
    memberName: {
      fontWeight: "800",
      color: colors.foreground,
    },
    leadBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: DOCTOR_RADIUS.pill,
    },
    leadBadgeText: {
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    memberMeta: {
      marginTop: 2,
      fontWeight: "500",
      color: colors.muted,
    },
    errorText: {
      marginHorizontal: DOCTOR_SPACE.lg,
      marginBottom: DOCTOR_SPACE.sm,
      fontWeight: "600",
      color: "#DC2626",
      textAlign: "center",
    },
    chatBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginHorizontal: DOCTOR_SPACE.lg,
      marginTop: DOCTOR_SPACE.sm,
      paddingVertical: 14,
      borderRadius: DOCTOR_RADIUS.md,
    },
    chatBtnText: {
      fontWeight: "800",
      color: "#fff",
    },
  });
}
