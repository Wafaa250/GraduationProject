import { router, type Href } from "expo-router";
import { Bell } from "lucide-react-native";
import { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { getCompanyNotificationsUnreadCount, NOTIFICATION_CATEGORY } from "@/api/notificationsApi";
import { useNotificationUnreadCount } from "@/hooks/useNotificationUnreadCount";
import { CompanyAccountAvatarButton } from "@/components/company/CompanyAccountAvatarButton";
import { createCompanyHomeStyles } from "@/components/company/home/companyHomeStyles";
import { CompanyBackButton } from "@/components/company/ui/CompanyBackButton";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyCanGoBack } from "@/hooks/useCompanyCanGoBack";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

type Props = {
  companyName?: string;
  showNotifications?: boolean;
  /** Extra content shown when back button is hidden. */
  left?: ReactNode;
  /** When true (default), show back if navigation history exists. */
  showBackWhenPushed?: boolean;
};

export function CompanyWorkspaceToolbar({
  companyName = "Company",
  showNotifications = true,
  left,
  showBackWhenPushed = true,
}: Props) {
  const colors = useCompanyTheme();
  const styles = createCompanyHomeStyles(colors);
  const { unreadCount: unread } = useNotificationUnreadCount({
    fetchCount: getCompanyNotificationsUnreadCount,
    matchesCreated: (payload) => payload.category === NOTIFICATION_CATEGORY.company,
  });
  const canGoBack = useCompanyCanGoBack();
  const showBack = showBackWhenPushed && canGoBack;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        gap: 12,
        borderBottomWidth: showBack ? 1 : 0,
        borderBottomColor: colors.border,
        backgroundColor: colors.cardBg,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        {showBack ? <CompanyBackButton /> : null}
        {!showBack && left ? <View style={{ flex: 1, minWidth: 0 }}>{left}</View> : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {showNotifications ? (
          <Pressable
            onPress={() => router.push(COMPANY_ROUTES.notifications as Href)}
            hitSlop={8}
            accessibilityLabel="Notifications"
            style={({ pressed }) => [
              styles.iconButton,
              { width: 42, height: 42, borderRadius: COMPANY_RADIUS.sm, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Bell size={18} color={colors.foreground} strokeWidth={2} />
            {unread > 0 ? (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.accent,
                  borderWidth: 2,
                  borderColor: colors.cardBg,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 3,
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "800" }}>
                  {unread > 99 ? "99+" : unread}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
        <CompanyAccountAvatarButton companyName={companyName} />
      </View>
    </View>
  );
}
