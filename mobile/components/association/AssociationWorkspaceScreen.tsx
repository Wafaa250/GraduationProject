import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";

import { AssociationAvatar } from "@/components/association/AssociationAvatar";
import {
  AssociationProfileMenuSheet,
  type ProfileMenuAnchor,
} from "@/components/association/AssociationProfileMenuSheet";
import { MobileNavHeader } from "@/components/navigation/MobileNavHeader";
import { getAllNotificationsUnreadCount } from "@/api/notificationsApi";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useAssociationWorkspace } from "@/contexts/AssociationWorkspaceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { ASSOCIATION_ROUTES } from "@/lib/associationRoutes";

type Props = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  showBack?: boolean;
  fallbackHref?: Href | string;
  onBackPress?: () => void;
  navTitle?: string;
};

export function AssociationWorkspaceScreen({
  children,
  refreshing = false,
  onRefresh,
  showBack = false,
  fallbackHref,
  onBackPress,
  navTitle,
}: Props) {
  const layout = useResponsiveLayout();
  const { associationName, logoUrl } = useAssociationWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<ProfileMenuAnchor | null>(null);
  const avatarRef = useRef<View>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

  const openNotifications = () => {
    setUnreadNotifications(0);
    router.push(ASSOCIATION_ROUTES.notifications as Href);
  };

  const notificationsButton = (
    <Pressable
      onPress={openNotifications}
      hitSlop={8}
      accessibilityLabel="Notifications"
      style={styles.notifBtn}
    >
      <Ionicons
        name="notifications-outline"
        size={layout.iconSize + 2}
        color={ASSOC_COLORS.foreground}
      />
      {unreadNotifications > 0 ? (
        <View style={styles.notifBadge}>
          <Text style={styles.notifBadgeText}>
            {unreadNotifications > 9 ? "9+" : unreadNotifications}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {showBack ? (
        <MobileNavHeader
          title={navTitle}
          fallbackHref={fallbackHref}
          onBackPress={onBackPress}
          backColor={ASSOC_COLORS.foreground}
          titleColor={ASSOC_COLORS.foreground}
          backgroundColor={ASSOC_COLORS.cardBg}
          borderColor={ASSOC_COLORS.border}
          rightSlot={notificationsButton}
        />
      ) : (
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: layout.horizontalPadding,
              minHeight: layout.touchTarget,
            },
          ]}
        >
          <View ref={avatarRef} collapsable={false} style={styles.avatarBtn}>
            <Pressable
              onPress={() => {
                avatarRef.current?.measureInWindow((x, y, width, height) => {
                  setMenuAnchor({ x, y, width, height });
                  setMenuOpen(true);
                });
              }}
              hitSlop={8}
              accessibilityLabel="Open organization menu"
            >
              <AssociationAvatar name={associationName} logoUrl={logoUrl} size="sm" />
            </Pressable>
          </View>

          <Text style={[styles.headerTitle, { fontSize: layout.fontSize.label }]} numberOfLines={1}>
            {associationName}
          </Text>

          {notificationsButton}
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.space("lg"),
            paddingBottom: layout.space("xxl"),
            gap: layout.space("lg"),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ASSOC_COLORS.accent}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>

      {!showBack ? (
      <AssociationProfileMenuSheet
        visible={menuOpen}
        anchor={menuAnchor}
        onClose={() => {
            setMenuOpen(false);
            setMenuAnchor(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

export function useAssociationWorkspaceRefresh() {
  const { reload } = useAssociationWorkspace();
  return reload;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ASSOC_COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.cardBg,
    paddingVertical: 10,
  },
  avatarBtn: {
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontWeight: "700",
    color: ASSOC_COLORS.foreground,
  },
  notifBtn: {
    padding: 4,
    position: "relative",
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ASSOC_COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    flexGrow: 1,
    width: "100%",
  },
});
