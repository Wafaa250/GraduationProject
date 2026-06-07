import { router, type Href } from "expo-router";
import { Bookmark, ChevronRight, Sparkles } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import {
  COMPANY_SAVED_EMPTY_INTRO,
  COMPANY_SAVED_EMPTY_STEP_1,
  COMPANY_SAVED_EMPTY_STEP_2,
  COMPANY_SAVED_EMPTY_STEP_3,
} from "@/lib/companyWorkspaceCopy";

const STEPS = [
  { title: "Open AI recommendations", body: COMPANY_SAVED_EMPTY_STEP_1 },
  { title: "Save from recommendations", body: COMPANY_SAVED_EMPTY_STEP_2 },
  { title: "Review your shortlist", body: COMPANY_SAVED_EMPTY_STEP_3 },
];

export function CompanySavedRecommendationsEmptyState() {
  const colors = useCompanyTheme();

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: COMPANY_RADIUS.xl,
        borderWidth: 1,
        borderColor: colors.border,
        padding: HOME_SPACE.xl,
        alignItems: "center",
        ...companyCardShadow(colors),
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: HOME_SPACE.lg,
        }}
      >
        <Bookmark size={28} color={colors.accent} strokeWidth={2.2} />
      </View>
      <Text style={{ fontSize: 10, fontWeight: "800", color: colors.accent, letterSpacing: 0.8 }}>
        SAVED RECOMMENDATIONS
      </Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          color: colors.foreground,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        No saved recommendations yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 21,
          color: colors.textSecondary,
          marginTop: 10,
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        {COMPANY_SAVED_EMPTY_INTRO}
      </Text>

      <View style={{ width: "100%", marginTop: HOME_SPACE.xl, gap: HOME_SPACE.md }}>
        {STEPS.map((step, index) => (
          <View key={step.title} style={{ flexDirection: "row", gap: HOME_SPACE.md }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "800", color: colors.accent }}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{step.title}</Text>
              <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginTop: 2 }}>
                {step.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ width: "100%", marginTop: HOME_SPACE.xl, gap: HOME_SPACE.sm }}>
        <Pressable
          onPress={() => router.push(COMPANY_ROUTES.requests as Href)}
          style={({ pressed }) => ({
            minHeight: 48,
            borderRadius: COMPANY_RADIUS.lg,
            backgroundColor: colors.accent,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Sparkles size={16} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF" }}>Open project requests</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(COMPANY_ROUTES.newRequest as Href)}
          style={({ pressed }) => ({
            minHeight: 48,
            borderRadius: COMPANY_RADIUS.lg,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Create new request</Text>
          <ChevronRight size={16} color={colors.foreground} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
