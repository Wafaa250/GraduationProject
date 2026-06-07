import { router, type Href } from "expo-router";
import { Sparkles, UserRound } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import type { CompanyRequestTeamRecommendationMember } from "@/api/companyApi";
import { CompanyMatchScoreRing } from "@/components/company/CompanyMatchScoreRing";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { studentInitials } from "@/lib/companyDashboardUtils";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { memberRoleExplanation } from "@/lib/companyTeamDiscovery";

type Props = {
  member: CompanyRequestTeamRecommendationMember;
  requestId: number;
  teamId: number;
};

export function CompanyTeamMemberCard({ member, requestId, teamId }: Props) {
  const colors = useCompanyTheme();
  const subtitle = [member.major || member.faculty, member.university].filter(Boolean).join(" · ");
  const explanation = memberRoleExplanation(member);

  return (
    <View
      style={{
        backgroundColor: colors.surfaceMuted,
        borderRadius: COMPANY_RADIUS.lg,
        padding: HOME_SPACE.md,
        gap: HOME_SPACE.sm,
      }}
    >
      <View style={{ flexDirection: "row", gap: HOME_SPACE.md, alignItems: "flex-start" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontWeight: "800", color: colors.accent }}>{studentInitials(member.studentName)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: COMPANY_RADIUS.sm,
              backgroundColor: colors.cardBg,
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textSecondary }}>{member.roleName}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }} numberOfLines={2}>
            {member.studentName}
          </Text>
          {subtitle ? (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <CompanyMatchScoreRing score={member.roleScore} size={48} />
      </View>

      {explanation ? (
        <View
          style={{
            padding: HOME_SPACE.sm,
            borderRadius: COMPANY_RADIUS.md,
            backgroundColor: colors.cardBg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Sparkles size={12} color={colors.accent} strokeWidth={2.2} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>Role fit</Text>
          </View>
          <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSecondary }}>{explanation}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() =>
          router.push(
            COMPANY_ROUTES.studentDiscoveryProfile(requestId, member.studentProfileId, teamId) as Href,
          )
        }
        style={({ pressed }) => ({
          minHeight: 44,
          borderRadius: COMPANY_RADIUS.md,
          backgroundColor: colors.accent,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <UserRound size={15} color="#FFFFFF" strokeWidth={2.2} />
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>View full profile</Text>
      </Pressable>
    </View>
  );
}
