import { UserMinus } from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { DoctorSupervisorCancelRequest } from "@/api/doctorDashboardApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { SupervisionStatusBadge } from "@/components/doctor/supervision/SupervisionStatusBadge";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { supervisionRequestLabel } from "@/lib/doctorRequestInbox";
import { normalizeSupervisionStatus } from "@/lib/supervisionRequestUi";

type Props = {
  request: DoctorSupervisorCancelRequest;
  busy?: boolean;
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
};

export function CancellationRequestListCard({ request, busy, onAccept, onReject }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const normalized = normalizeSupervisionStatus(request.status);
  const isPending = normalized === "pending";
  const studentName = request.studentName?.trim() || "Student";
  const projectName = request.projectName?.trim() || "Graduation project";
  const code = `CAN-${String(request.requestId).padStart(5, "0")}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FeedAvatar name={studentName} size={layout.scale(40)} roleType="student" />
        <View style={styles.headerBody}>
          <View style={styles.titleLine}>
            <Text style={[styles.studentName, { fontSize: layout.scale(15) }]} numberOfLines={1}>
              {studentName}
            </Text>
            <SupervisionStatusBadge status={request.status} compact />
          </View>
          <Text style={[styles.code, { fontSize: layout.scale(11) }]}>{code}</Text>
          <Text style={[styles.kindLabel, { fontSize: layout.scale(11) }]}>
            {supervisionRequestLabel("cancellation")}
          </Text>
        </View>
      </View>

      <View style={styles.projectBox}>
        <UserMinus size={16} color="#D97706" strokeWidth={2.2} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.projectLabel, { fontSize: layout.scale(10) }]}>Project</Text>
          <Text style={[styles.projectName, { fontSize: layout.scale(14) }]}>{projectName}</Text>
          <Text style={[styles.projectHint, { fontSize: layout.scale(12) }]}>
            The project leader requested to end your supervision for this project.
          </Text>
        </View>
      </View>

      {isPending ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.rejectBtn, busy && styles.btnDisabled]}
            disabled={busy}
            onPress={() => onReject(request.requestId)}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.rejectText}>Reject</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.acceptBtn, busy && styles.btnDisabled]}
            disabled={busy}
            onPress={() => onAccept(request.requestId)}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptText}>Accept cancellation</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <Text style={[styles.resolved, { fontSize: layout.scale(12) }]}>
          {normalized === "accepted" ? "Supervision ended" : "Cancellation declined"}
        </Text>
      )}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(245, 158, 11, 0.35)",
      backgroundColor: colors.cardBg,
      borderRadius: DOCTOR_RADIUS.md,
      padding: DOCTOR_SPACE.md,
      gap: DOCTOR_SPACE.md,
    },
    header: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      alignItems: "flex-start",
    },
    headerBody: { flex: 1, gap: 2 },
    titleLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    studentName: {
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
    },
    code: {
      color: colors.muted,
      fontFamily: "monospace",
    },
    kindLabel: {
      color: "#D97706",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    projectBox: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(245, 158, 11, 0.25)",
      backgroundColor: "rgba(245, 158, 11, 0.08)",
      borderRadius: DOCTOR_RADIUS.sm,
      padding: DOCTOR_SPACE.md,
    },
    projectLabel: {
      color: colors.muted,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    projectName: {
      fontWeight: "700",
      color: colors.foreground,
    },
    projectHint: {
      color: colors.muted,
      marginTop: 4,
      lineHeight: 18,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: DOCTOR_SPACE.sm,
    },
    rejectBtn: {
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.25)",
      borderRadius: DOCTOR_RADIUS.sm,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: 40,
      justifyContent: "center",
    },
    rejectText: {
      color: "#DC2626",
      fontWeight: "700",
      fontSize: 13,
    },
    acceptBtn: {
      backgroundColor: colors.primary,
      borderRadius: DOCTOR_RADIUS.sm,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: 40,
      justifyContent: "center",
    },
    acceptText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 13,
    },
    btnDisabled: { opacity: 0.6 },
    resolved: {
      color: colors.muted,
      fontWeight: "600",
      textAlign: "right",
    },
  });
}
