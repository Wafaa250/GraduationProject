import type { Href } from "expo-router";
import type { ReactNode } from "react";
import { Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompanyAccountAvatarButton } from "@/components/company/CompanyAccountAvatarButton";
import { CompanyBackButton } from "@/components/company/ui/CompanyBackButton";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Props = {
  title: string;
  subtitle?: string;
  /** Custom back handler (e.g. unsaved-changes prompt). Defaults to history-based back. */
  onBack?: () => void;
  /** Used only when navigation history is unavailable (deep links). */
  fallbackHref?: Href | string;
  right?: ReactNode;
  showAccountMenu?: boolean;
  /** Nested screens should always show back. */
  showBack?: boolean;
};

export function CompanyStackHeader({
  title,
  subtitle,
  onBack,
  fallbackHref,
  right,
  showAccountMenu = true,
  showBack = true,
}: Props) {
  const colors = useCompanyTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: colors.cardBg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {showBack ? (
          <CompanyBackButton onBack={onBack} fallbackHref={fallbackHref} />
        ) : (
          <View style={{ width: 40 } as ViewStyle} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {right}
          {showAccountMenu ? <CompanyAccountAvatarButton size={34} /> : null}
        </View>
      </View>
    </View>
  );
}
