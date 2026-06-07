import { router, type Href } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { createCompanyHomeStyles, HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { COMPANY_DASHBOARD_WELCOME_MESSAGE } from "@/lib/companyWorkspaceCopy";

export function CompanyHeroCard() {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyHomeStyles(colors), [colors]);

  return (
    <View style={{ marginBottom: HOME_SPACE.lg }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: colors.foreground,
          letterSpacing: -0.5,
        }}
      >
        Welcome back
      </Text>
      <Text
        style={{
          marginTop: 4,
          fontSize: 14,
          lineHeight: 20,
          color: colors.textSecondary,
        }}
      >
        {COMPANY_DASHBOARD_WELCOME_MESSAGE}
      </Text>

      <Pressable
        onPress={() => router.push(COMPANY_ROUTES.newRequest as Href)}
        style={({ pressed }) => [
          styles.primaryBtn,
          styles.primaryBtnCompact,
          { marginTop: HOME_SPACE.md, opacity: pressed ? 0.92 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Create new request"
      >
        <Plus size={17} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={styles.primaryBtnText}>Create Request</Text>
      </Pressable>
    </View>
  );
}
