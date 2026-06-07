import { router, type Href } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import type { CompanyDashboardSavedStudent } from "@/api/companyApi";
import { CompanyMatchScoreRing } from "@/components/company/CompanyMatchScoreRing";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { formatDashboardDate, studentInitials } from "@/lib/companyDashboardUtils";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

type Props = {
  students: CompanyDashboardSavedStudent[];
};

export function CompanySavedCandidatesRow({ students }: Props) {
  const colors = useCompanyTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: HOME_SPACE.md, paddingVertical: 4 }}
    >
      {students.map((student) => (
        <View
          key={`${student.companyRequestId}-${student.studentProfileId}`}
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
                borderRadius: 24,
                backgroundColor: colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.accent }}>
                {studentInitials(student.studentName)}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
                {student.studentName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {[student.university, student.major].filter(Boolean).join(" · ") || "—"}
              </Text>
            </View>
            {student.matchScore != null ? <CompanyMatchScoreRing score={student.matchScore} size={48} /> : null}
          </View>

          <Text style={{ marginTop: HOME_SPACE.md, fontSize: 11, color: colors.muted }}>
            Saved {formatDashboardDate(student.savedAt)}
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                COMPANY_ROUTES.studentDiscoveryProfile(
                  student.companyRequestId,
                  student.studentProfileId,
                ) as Href,
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
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>View Profile</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
