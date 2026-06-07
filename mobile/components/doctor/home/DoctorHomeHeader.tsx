import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, type Href } from "expo-router";
import { Bell, ChevronDown, MessageCircle, Plus, Sparkles } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, Text, View } from "react-native";

import { getAllNotificationsUnreadCount } from "@/api/notificationsApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { useDoctorAccountMenu } from "@/components/doctor/DoctorAccountMenuProvider";
import { createDoctorHomeStyles, HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { DOCTOR_RADIUS } from "@/components/doctor/ui/doctorDesignSystem";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getTimeOfDayGreeting } from "@/lib/doctorHubMappers";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

type Props = {
  displayName: string;
  greetingName: string;
  profilePhoto?: string | null;
  pendingCount?: number;
  activeCount?: number;
  unreadMessages?: number;
  onComposePress?: () => void;
};

export function DoctorHomeHeader({
  displayName,
  greetingName,
  profilePhoto,
  pendingCount = 0,
  activeCount = 0,
  unreadMessages = 0,
  onComposePress,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createDoctorHomeStyles(colors), [colors]);
  const { toggleAccountMenu, closeAccountMenu, isMenuOpen } = useDoctorAccountMenu();
  const profileAnchorRef = useRef<View>(null);
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const [unread, setUnread] = useState(0);
  const avatarSize = layout.scale(50);

  const loadUnread = useCallback(async () => {
    try {
      setUnread(await getAllNotificationsUnreadCount());
    } catch {
      setUnread(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUnread();
      return () => closeAccountMenu();
    }, [loadUnread, closeAccountMenu]),
  );
  useEffect(() => {
    void loadUnread();
  }, [loadUnread]);

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: isMenuOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen, chevronAnim]);

  const insight =
    pendingCount > 0
      ? `${pendingCount} request${pendingCount === 1 ? "" : "s"} awaiting review`
      : activeCount > 0
        ? `${activeCount} active project${activeCount === 1 ? "" : "s"} under supervision`
        : "Your supervision workspace is ready";

  const handleProfilePress = () => {
    requestAnimationFrame(() => {
      profileAnchorRef.current?.measureInWindow((x, y, width, height) => {
        toggleAccountMenu({ x, y, width, height });
      });
    });
  };

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const chevronColor = isMenuOpen ? colors.primary : "rgba(255,255,255,0.88)";

  const runWithMenuClose = (action: () => void) => {
    if (isMenuOpen) closeAccountMenu();
    action();
  };

  return (
    <LinearGradient
      colors={[colors.gradient[0], colors.gradient[1], colors.cardBg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroInner}>
        <View style={styles.heroRow}>
          <Pressable
            ref={profileAnchorRef}
            collapsable={false}
            onPress={handleProfilePress}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ expanded: isMenuOpen }}
            accessibilityLabel="Doctor account menu"
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              minWidth: 0,
              marginRight: HOME_SPACE.sm,
              borderRadius: DOCTOR_RADIUS.md,
              paddingVertical: 2,
              paddingRight: 4,
              backgroundColor: isMenuOpen ? "rgba(255,255,255,0.12)" : pressed ? "rgba(255,255,255,0.08)" : "transparent",
            })}
          >
            <View
              style={[
                styles.avatarRing,
                {
                  width: avatarSize + 8,
                  height: avatarSize + 8,
                  borderRadius: (avatarSize + 8) / 2,
                  flexShrink: 0,
                },
              ]}
            >
              <FeedAvatar name={displayName} size={avatarSize} avatarBase64={profilePhoto} roleType="doctor" />
            </View>

            <View style={{ flex: 1, marginLeft: HOME_SPACE.md, minWidth: 0 }}>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>
                {getTimeOfDayGreeting()}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 6 }}>
                <Text
                  style={{
                    flexShrink: 1,
                    fontSize: layout.scale(22),
                    fontWeight: "800",
                    color: "#FFFFFF",
                    letterSpacing: -0.5,
                  }}
                  numberOfLines={1}
                >
                  {greetingName}
                </Text>
                <Animated.View style={{ flexShrink: 0, transform: [{ rotate: chevronRotation }] }}>
                  <ChevronDown size={17} color={chevronColor} strokeWidth={2.5} />
                </Animated.View>
              </View>
              <View style={[styles.rolePill, { alignSelf: "flex-start" }]}>
                <Text style={styles.rolePillText}>DOCTOR</Text>
              </View>
            </View>
          </Pressable>

          <View style={{ flexDirection: "row", gap: 6, flexShrink: 0 }}>
            {onComposePress ? (
              <HeaderIcon onPress={() => runWithMenuClose(onComposePress)} label="Share announcement">
                <Plus size={18} color={colors.foreground} strokeWidth={2.5} />
              </HeaderIcon>
            ) : null}
            <HeaderIcon
              onPress={() => runWithMenuClose(() => router.push(DOCTOR_ROUTES.notifications as Href))}
              label="Notifications"
              badge={unread}
            >
              <Bell size={18} color={colors.foreground} strokeWidth={2} />
            </HeaderIcon>
            <HeaderIcon
              onPress={() => runWithMenuClose(() => router.push(DOCTOR_ROUTES.messages as Href))}
              label="Messages"
              badge={unreadMessages > 0 ? unreadMessages : undefined}
            >
              <MessageCircle size={18} color={colors.foreground} strokeWidth={2} />
            </HeaderIcon>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: HOME_SPACE.sm,
            marginTop: HOME_SPACE.md,
            paddingTop: HOME_SPACE.md,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.18)",
          }}
        >
          <Sparkles size={14} color="rgba(255,255,255,0.9)" strokeWidth={2.2} />
          <Text style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.92)", fontWeight: "600", lineHeight: 18 }}>
            {insight}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function HeaderIcon({
  children,
  onPress,
  label,
  badge,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  badge?: number;
}) {
  const { colors } = useDoctorTheme();
  const styles = createDoctorHomeStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        { width: 38, height: 38, borderRadius: DOCTOR_RADIUS.sm, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      {children}
      {badge != null && badge > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 17,
            height: 17,
            borderRadius: 9,
            backgroundColor: colors.primary,
            borderWidth: 2,
            borderColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "800" }}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
