import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, type Href } from "expo-router";
import { Bell, MessageCircle } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getAllNotificationsUnreadCount } from "@/api/notificationsApi";
import { useNotificationsHubSync } from "@/hooks/useNotificationsHubSync";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getTimeOfDayGreeting } from "@/lib/doctorHubMappers";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

type Props = {
  displayName: string;
  greetingName: string;
  profilePhoto?: string | null;
};

export function DoctorDashboardHeader({ displayName, greetingName, profilePhoto }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const avatarSize = layout.scale(52);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getAllNotificationsUnreadCount();
      setUnreadNotifications(count);
    } catch {
      setUnreadNotifications(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUnreadCount();
    }, [loadUnreadCount]),
  );

  useEffect(() => {
    void loadUnreadCount();
  }, [loadUnreadCount]);

  useNotificationsHubSync({
    onCreated: (notification) => {
      if (!notification.readAt) {
        setUnreadNotifications((count) => count + 1);
      }
    },
    onReconnect: () => void loadUnreadCount(),
  });

  return (
    <LinearGradient
      colors={[colors.primarySoft, colors.cardBg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.hero,
        {
          borderRadius: 18,
          padding: layout.space("md"),
          marginBottom: layout.space("md"),
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.avatarRing, { width: avatarSize + 6, height: avatarSize + 6, borderRadius: (avatarSize + 6) / 2 }]}>
          <FeedAvatar
            name={displayName}
            size={avatarSize}
            avatarBase64={profilePhoto}
            roleType="doctor"
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.greetingLine, { fontSize: layout.scale(13) }]} numberOfLines={2}>
            {getTimeOfDayGreeting()},{" "}
            <Text style={styles.nameEmphasis}>{greetingName}</Text>
          </Text>
          <Text style={[styles.subline, { fontSize: layout.scale(11), marginTop: 3 }]} numberOfLines={1}>
            SkillSwap Doctor Workspace
          </Text>
        </View>

        <View style={styles.actions}>
          <HeaderIconButton
            onPress={() => router.push(DOCTOR_ROUTES.notifications as Href)}
            label="Notifications"
            badge={unreadNotifications}
            colors={colors}
            size={layout.scale(38)}
          >
            <Bell size={layout.scale(18)} color={colors.foreground} strokeWidth={2} />
          </HeaderIconButton>
          <HeaderIconButton
            onPress={() => router.push(DOCTOR_ROUTES.messages as Href)}
            label="Messages"
            colors={colors}
            size={layout.scale(38)}
          >
            <MessageCircle size={layout.scale(18)} color={colors.foreground} strokeWidth={2} />
          </HeaderIconButton>
        </View>
      </View>
    </LinearGradient>
  );
}

function HeaderIconButton({
  children,
  onPress,
  label,
  badge,
  colors,
  size,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  badge?: number;
  colors: HubColorScheme;
  size: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.cardBg,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {children}
      {badge != null && badge > 0 ? (
        <View
          style={{
            position: "absolute",
            top: 3,
            right: 3,
            minWidth: 15,
            height: 15,
            borderRadius: 8,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 8, fontWeight: "800" }}>
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    hero: {
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatarRing: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.cardBg,
    },
    textBlock: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },
    greetingLine: {
      color: colors.muted,
      fontWeight: "500",
      lineHeight: 18,
    },
    nameEmphasis: {
      color: colors.foreground,
      fontWeight: "800",
    },
    subline: {
      color: colors.muted,
      fontWeight: "600",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginLeft: 4,
    },
  });
