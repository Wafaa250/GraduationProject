import { router, useFocusEffect, type Href } from "expo-router";
import { Bell } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { getCompanyNotificationsUnreadCount } from "@/api/notificationsApi";
import { CompanyAccountAvatarButton } from "@/components/company/CompanyAccountAvatarButton";
import { createCompanyHomeStyles } from "@/components/company/home/companyHomeStyles";
import { CompanyBackButton } from "@/components/company/ui/CompanyBackButton";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyCanGoBack } from "@/hooks/useCompanyCanGoBack";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

type Props = {
  companyName: string;
};

export function CompanyHomeHeader({ companyName }: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyHomeStyles(colors), [colors]);
  const [unread, setUnread] = useState(0);
  const canGoBack = useCompanyCanGoBack();

  const loadUnread = useCallback(async () => {
    try {
      setUnread(await getCompanyNotificationsUnreadCount());
    } catch {
      setUnread(0);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadUnread(); }, [loadUnread]));
  useEffect(() => { void loadUnread(); }, [loadUnread]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 10,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.cardBg,
      }}
    >
      {canGoBack ? <CompanyBackButton /> : null}

      <Text
        style={{ flex: 1, fontSize: 17, fontWeight: "700", color: colors.foreground, letterSpacing: -0.2 }}
        numberOfLines={1}
      >
        {companyName}
      </Text>

      <Pressable
        onPress={() => router.push(COMPANY_ROUTES.notifications as Href)}
        hitSlop={8}
        accessibilityLabel="Notifications"
        style={({ pressed }) => [
          styles.iconButton,
          { width: 40, height: 40, borderRadius: COMPANY_RADIUS.sm, opacity: pressed ? 0.88 : 1 },
        ]}
      >
        <Bell size={18} color={colors.foreground} strokeWidth={2} />
        {unread > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 17,
              height: 17,
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

      <CompanyAccountAvatarButton companyName={companyName} size={34} />
    </View>
  );
}
