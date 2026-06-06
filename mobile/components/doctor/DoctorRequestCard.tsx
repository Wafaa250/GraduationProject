import { Calendar, Check, Users, X } from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { DoctorStatusBadge } from "@/components/doctor/DoctorStatusBadge";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { DoctorRequestCardModel } from "@/lib/doctorHubMappers";

type Props = {
  request: DoctorRequestCardModel;
  busyRequestId?: number | null;
  onAccept?: (requestId: number) => void;
  onReject?: (requestId: number) => void;
};

export function DoctorRequestCard({ request, busyRequestId, onAccept, onReject }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isPending = request.status === "pending";
  const busy = busyRequestId === request.requestId;
  const visibleSkills = request.skills.slice(0, 3);
  const extraSkills = request.skills.length - visibleSkills.length;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: 14,
          padding: layout.space("md"),
          marginBottom: layout.space("sm"),
        },
      ]}
    >
      <View style={styles.topRow}>
        <FeedAvatar name={request.student} size={layout.scale(36)} roleType="student" />
        <View style={styles.topText}>
          <Text style={[styles.studentName, { fontSize: layout.scale(13) }]} numberOfLines={1}>
            {request.student}
          </Text>
          <Text style={[styles.major, { fontSize: layout.scale(11) }]} numberOfLines={1}>
            {request.major}
          </Text>
        </View>
        <DoctorStatusBadge status={request.status} />
      </View>

      <Text
        style={[styles.projectTitle, { fontSize: layout.scale(14), marginTop: layout.space("sm") }]}
        numberOfLines={2}
      >
        {request.title}
      </Text>

      {visibleSkills.length > 0 ? (
        <View style={[styles.skillsRow, { marginTop: layout.space("sm"), gap: 4 }]}>
          {visibleSkills.map((skill) => (
            <View key={skill} style={[styles.skillChip, { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }]}>
              <Text style={[styles.skillText, { fontSize: layout.scale(10) }]} numberOfLines={1}>
                {skill}
              </Text>
            </View>
          ))}
          {extraSkills > 0 ? (
            <View style={[styles.skillChip, { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }]}>
              <Text style={[styles.skillText, { fontSize: layout.scale(10) }]}>+{extraSkills}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.metaRow, { marginTop: layout.space("sm") }]}>
        <View style={styles.metaItem}>
          <Users size={12} color={colors.muted} strokeWidth={2} />
          <Text style={[styles.metaText, { fontSize: layout.scale(11), marginLeft: 4 }]}>
            Team of {request.team}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Calendar size={12} color={colors.muted} strokeWidth={2} />
          <Text style={[styles.metaText, { fontSize: layout.scale(11), marginLeft: 4 }]}>
            {request.date}
          </Text>
        </View>
      </View>

      <View style={[styles.actionsRow, { marginTop: layout.space("sm"), gap: 8 }]}>
        <Pressable
          onPress={() => onReject?.(request.requestId)}
          disabled={!isPending || busy}
          style={({ pressed }) => [
            styles.rejectBtn,
            {
              borderRadius: 10,
              minHeight: 40,
              opacity: !isPending || busy ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <X size={14} color="#EF4444" strokeWidth={2.5} />
              <Text style={[styles.rejectText, { fontSize: layout.scale(12), marginLeft: 4 }]}>Reject</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => onAccept?.(request.requestId)}
          disabled={!isPending || busy}
          style={({ pressed }) => [
            styles.acceptBtn,
            {
              borderRadius: 10,
              minHeight: 40,
              opacity: !isPending || busy ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={[styles.acceptText, { fontSize: layout.scale(12), marginLeft: 4 }]}>Accept</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 2,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    topText: {
      flex: 1,
      minWidth: 0,
    },
    studentName: {
      fontWeight: "700",
      color: colors.foreground,
    },
    major: {
      color: colors.muted,
      marginTop: 1,
    },
    projectTitle: {
      fontWeight: "700",
      color: colors.foreground,
      lineHeight: 18,
    },
    skillsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    skillChip: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: "100%",
    },
    skillText: {
      color: colors.foreground,
      fontWeight: "600",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    metaText: {
      color: colors.muted,
      fontWeight: "500",
    },
    actionsRow: {
      flexDirection: "row",
    },
    rejectBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.35)",
      backgroundColor: "rgba(239, 68, 68, 0.08)",
    },
    rejectText: {
      color: "#EF4444",
      fontWeight: "700",
    },
    acceptBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    acceptText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
  });
