import { router, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { createCompanyProfileStyles } from "@/components/company/profile/companyProfileStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { COMPANY_PROFILE_SUBTITLE } from "@/lib/companyWorkspaceCopy";

type Props = {
  canEdit?: boolean;
};

export function CompanyProfilePageHeader({ canEdit = false }: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);

  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.pageTitle}>Company Profile</Text>
        <Text style={styles.pageSubtitle}>{COMPANY_PROFILE_SUBTITLE}</Text>
      </View>
      {canEdit ? (
        <Pressable
          onPress={() => router.push(COMPANY_ROUTES.editProfile as Href)}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityLabel="Edit company profile"
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
