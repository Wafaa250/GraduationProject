import { router, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompanyThemeGalleryBar } from "@/components/company/themes/CompanyThemeGalleryBar";
import { CompanyThemePreviewCard } from "@/components/company/themes/CompanyThemePreviewCard";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyWorkspaceTheme } from "@/contexts/CompanyWorkspaceThemeContext";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { isCompanyOwner } from "@/lib/companyWorkspace";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import {
  COMPANY_THEME_META,
  listCompanyThemes,
  type CompanyThemeId,
} from "@/lib/companyThemes";
import { navigateBack } from "@/lib/mobileBackNavigation";

export default function CompanyThemeGalleryScreen() {
  const colors = useCompanyTheme();
  const insets = useSafeAreaInsets();
  const { themeId: activeTheme, applyTheme } = useCompanyWorkspaceTheme();
  const [selected, setSelected] = useState<CompanyThemeId>(activeTheme);
  const [applying, setApplying] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    setSelected(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    void (async () => {
      const owner = await isCompanyOwner();
      if (!owner) {
        router.replace(COMPANY_ROUTES.dashboard as Href);
        return;
      }
      setAccessChecked(true);
    })();
  }, []);

  const handleCancel = useCallback(() => {
    navigateBack(COMPANY_ROUTES.settings);
  }, []);

  const handleApply = useCallback(async () => {
    if (applying) return;
    setApplying(true);
    try {
      await applyTheme(selected);
      Alert.alert("Theme applied", `${COMPANY_THEME_META[selected].label} is now your workspace palette.`);
      navigateBack(COMPANY_ROUTES.settings);
    } finally {
      setApplying(false);
    }
  }, [applying, applyTheme, selected]);

  if (!accessChecked) {
    return (
      <CompanyScreen edges={[]}>
        <CompanyStackHeader title="Theme Gallery" fallbackHref={COMPANY_ROUTES.settings} />
      </CompanyScreen>
    );
  }

  const themes = listCompanyThemes();

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader
        title="Theme Gallery"
        subtitle="Preview and apply palettes"
        fallbackHref={COMPANY_ROUTES.settings}
      />

      <ScrollView
        contentContainerStyle={{
          padding: HOME_SPACE.lg,
          paddingBottom: insets.bottom + 160,
          gap: HOME_SPACE.md,
        }}
      >
        <View
          style={{
            borderRadius: COMPANY_RADIUS.lg,
            borderWidth: 1,
            borderColor: colors.accentBorder,
            backgroundColor: colors.accentSoft,
            padding: HOME_SPACE.md,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.6 }}>
            CURRENT THEME
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, marginTop: 4 }}>
            {COMPANY_THEME_META[activeTheme].label}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {COMPANY_THEME_META[activeTheme].tagline}
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>Pick your palette</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 6, lineHeight: 20 }}>
            Five complete themes — same UI, different character. Tap a card, then apply to the whole workspace.
          </Text>
        </View>

        {themes.map(({ id, meta }) => (
          <CompanyThemePreviewCard
            key={id}
            themeId={id}
            meta={meta}
            selected={selected === id}
            active={activeTheme === id}
            onPress={() => setSelected(id)}
          />
        ))}
      </ScrollView>

      <CompanyThemeGalleryBar
        selectedThemeId={selected}
        onCancel={handleCancel}
        onApply={() => void handleApply()}
        applying={applying}
      />
    </CompanyScreen>
  );
}
