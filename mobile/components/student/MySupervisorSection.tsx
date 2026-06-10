import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import type { GradProjectSupervisor } from "@/api/gradProjectApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { openStudentDirectMessage } from "@/lib/openStudentDirectMessage";

type Props = {
  supervisor: GradProjectSupervisor;
};

function formatAssignedDate(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function MySupervisorSection({ supervisor }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [messaging, setMessaging] = useState(false);

  const assignedLabel = formatAssignedDate(supervisor.assignedAt);

  const handleMessage = async () => {
    if (!supervisor.userId) return;
    setMessaging(true);
    try {
      await openStudentDirectMessage(supervisor.userId);
    } catch (err) {
      Alert.alert("Could not start conversation", parseApiErrorMessage(err));
    } finally {
      setMessaging(false);
    }
  };

  const handleViewProfile = () => {
    if (!supervisor.userId) return;
    router.push(`/doctors/${supervisor.userId}` as Href);
  };

  return (
    <HubSectionCard title="My Supervisor" description="Assigned faculty supervisor">
      <View style={[styles.row, { gap: layout.space("md") }]}>
        <FeedAvatar name={supervisor.name} size={layout.scale(56)} roleType="doctor" />
        <View style={styles.meta}>
          <Text style={[styles.name, { fontSize: layout.fontSize.title }]}>{supervisor.name}</Text>
          <Text style={styles.subtitle}>
            {supervisor.specialization?.trim() || "Faculty supervisor"}
          </Text>
          {supervisor.faculty?.trim() ? (
            <Text style={styles.detail}>Faculty: {supervisor.faculty}</Text>
          ) : null}
          {supervisor.department?.trim() ? (
            <Text style={styles.detail}>Department: {supervisor.department}</Text>
          ) : null}
          {supervisor.email?.trim() ? <Text style={styles.detail}>{supervisor.email}</Text> : null}
          {assignedLabel ? <Text style={styles.detail}>Assigned {assignedLabel}</Text> : null}
        </View>
      </View>

      <View style={[styles.actions, { marginTop: layout.space("md") }]}>
        <Pressable
          onPress={() => void handleMessage()}
          disabled={messaging || !supervisor.userId}
          style={({ pressed }) => [
            styles.primaryBtn,
            { borderRadius: layout.radius.input, opacity: pressed || messaging ? 0.85 : 1 },
          ]}
        >
          {messaging ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Message Supervisor</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={handleViewProfile}
          disabled={!supervisor.userId}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderRadius: layout.radius.input, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="person-outline" size={16} color={colors.foreground} />
          <Text style={styles.secondaryBtnText}>View Profile</Text>
        </Pressable>
      </View>
    </HubSectionCard>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    meta: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    name: {
      fontWeight: "800",
      color: colors.foreground,
    },
    subtitle: {
      color: colors.muted,
      fontWeight: "500",
    },
    detail: {
      color: colors.muted,
      fontSize: 13,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minWidth: 160,
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    secondaryBtnText: {
      color: colors.foreground,
      fontWeight: "700",
      fontSize: 14,
    },
  });
}
