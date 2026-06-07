import { router, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { CompanyRequestTeamRecommendationMember } from "@/api/companyApi";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanyStudentContactRows } from "@/components/company/saved/CompanyStudentContactRows";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { studentInitials } from "@/lib/companyDashboardUtils";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

type Props = {
  member: CompanyRequestTeamRecommendationMember;
  requestId: number;
  teamId: number;
};

export function CompanyTeamMemberContactCard({ member, requestId, teamId }: Props) {
  const colors = useCompanyTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surfaceMuted,
        borderRadius: COMPANY_RADIUS.lg,
        padding: HOME_SPACE.md,
        gap: HOME_SPACE.sm,
      }}
    >
      <View style={{ flexDirection: "row", gap: HOME_SPACE.md, alignItems: "center" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontWeight: "800", fontSize: 13, color: colors.accent }}>
            {studentInitials(member.studentName)}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
            {member.studentName}
          </Text>
          <Text style={{ fontSize: 12, color: colors.accent, marginTop: 2 }}>{member.roleName}</Text>
        </View>
      </View>

      <CompanyStudentContactRows contact={member} />

      <Pressable onPress={() =>
          router.push(
            COMPANY_ROUTES.studentDiscoveryProfile(requestId, member.studentProfileId, teamId) as Href,
          )
        }>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent, textAlign: "center", paddingVertical: 4 }}>
          View full profile
        </Text>
      </Pressable>
    </View>
  );
}
