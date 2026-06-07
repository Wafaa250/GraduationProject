import { router, type Href } from "expo-router";
import { UsersRound } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import type { CompanyDashboardSavedTeam } from "@/api/companyApi";
import { CompanyMatchScoreRing } from "@/components/company/CompanyMatchScoreRing";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { formatDashboardDate } from "@/lib/companyDashboardUtils";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

type Props = {
  teams: CompanyDashboardSavedTeam[];
};

export function CompanySavedTeamsRow({ teams }: Props) {
  const colors = useCompanyTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: HOME_SPACE.md, paddingVertical: 4 }}
    >
      {teams.map((team) => (
        <View
          key={`${team.companyRequestId}-${team.teamRecommendationId}`}
          style={{
            width: 260,
            backgroundColor: colors.cardBg,
            borderRadius: COMPANY_RADIUS.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: HOME_SPACE.lg,
            ...companyCardShadow(colors),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: HOME_SPACE.md }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: COMPANY_RADIUS.md,
                backgroundColor: colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UsersRound size={22} color={colors.accent} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
                {team.teamName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
              </Text>
            </View>
            {team.matchScore > 0 ? <CompanyMatchScoreRing score={team.matchScore} size={48} /> : null}
          </View>

          <Text style={{ marginTop: HOME_SPACE.md, fontSize: 11, color: colors.muted }}>
            Saved {formatDashboardDate(team.savedAt)}
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                COMPANY_ROUTES.teamDiscoveryProfile(team.companyRequestId, team.teamRecommendationId) as Href,
              )
            }
            style={({ pressed }) => ({
              marginTop: HOME_SPACE.md,
              paddingVertical: 10,
              borderRadius: COMPANY_RADIUS.sm,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>View Team</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
