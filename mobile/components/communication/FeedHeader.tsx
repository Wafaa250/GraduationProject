import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getMe } from "@/api/meApi";
import { getAllNotificationsUnreadCount } from "@/api/notificationsApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { FeedSearchModal } from "@/components/communication/FeedSearchModal";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useHubAccountMenu } from "@/contexts/HubAccountMenuContext";
import { useHubDesign } from "@/hooks/use-hub-design";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { useNotificationsHubSync } from "@/hooks/useNotificationsHubSync";
import { getItem } from "@/utils/authStorage";

type Props = {
  onSearchActiveChange?: (active: boolean) => void;
};

export function FeedHeader({ onSearchActiveChange }: Props) {
  const hub = useHubDesign();
  const { colors, layout } = hub;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { openMenu } = useHubAccountMenu();
  const avatarRef = useRef<View>(null);
  const [displayName, setDisplayName] = useState("Student");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const [me, unread] = await Promise.all([
        getMe(),
        getAllNotificationsUnreadCount().catch(() => 0),
      ]);
      setDisplayName(me.name?.trim() || "Student");
      setAvatarBase64(me.profilePictureBase64 ?? null);
      setUnreadNotifications(unread);
    } catch {
      const storedName = await getItem("name");
      if (storedName) setDisplayName(storedName);
      setUnreadNotifications(0);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const unread = await getAllNotificationsUnreadCount();
      setUnreadNotifications(unread);
    } catch {
      setUnreadNotifications(0);
    }
  }, []);

  useNotificationsHubSync({
    onCreated: (notification) => {
      if (!notification.readAt) {
        setUnreadNotifications((count) => count + 1);
      }
    },
    onReconnect: () => void refreshUnreadCount(),
  });

  const openAccountMenu = () => {
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      openMenu({ x, y, width, height });
    });
  };

  const openSearch = () => {
    setSearchOpen(true);
    onSearchActiveChange?.(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    onSearchActiveChange?.(false);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.space("sm"),
            paddingBottom: layout.space("sm"),
          },
        ]}
      >
        <View style={styles.topRow}>
          <View ref={avatarRef} collapsable={false}>
            <Pressable
              onPress={openAccountMenu}
              accessibilityRole="button"
              accessibilityLabel="Open account menu"
              hitSlop={8}
            >
              {loadingProfile ? (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { width: hub.avatar.header, height: hub.avatar.header },
                  ]}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <FeedAvatar
                  name={displayName}
                  size={hub.avatar.header}
                  avatarBase64={profilePhotoUrl(avatarBase64) ? avatarBase64 : null}
                  roleType="student"
                />
              )}
            </Pressable>
          </View>

          <Pressable
            style={[styles.searchWrap, { borderRadius: hub.radius.button }]}
            onPress={openSearch}
          >
            <Ionicons name="search" size={hub.icon.md} color={colors.muted} />
            <Text style={styles.searchPlaceholder}>Search people, companies...</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setUnreadNotifications(0);
              router.push("/notifications");
            }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
            style={styles.notifBtn}
          >
            <Ionicons name="notifications-outline" size={hub.icon.lg} color={colors.foreground} />
            {unreadNotifications > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <FeedSearchModal
        visible={searchOpen}
        initialQuery={searchQuery}
        onClose={closeSearch}
        onQueryChange={setSearchQuery}
      />
    </>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    avatarPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      backgroundColor: colors.primarySoft,
    },
    searchWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 11,
      minHeight: 44,
    },
    searchPlaceholder: {
      flex: 1,
      color: colors.muted,
      fontSize: 15,
    },
    notifBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    notifBadge: {
      position: "absolute",
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    notifBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
  });
