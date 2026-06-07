import { router, type Href } from "expo-router";
import { Mail, Sparkles, Trash2 } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { CompanySavedStudentRecommendation } from "@/api/companyApi";
import { CompanyMatchScoreRing } from "@/components/company/CompanyMatchScoreRing";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanySavedRecommendationNoteField } from "@/components/company/saved/CompanySavedRecommendationNoteField";
import { CompanyStudentContactRows } from "@/components/company/saved/CompanyStudentContactRows";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { studentInitials } from "@/lib/companyDashboardUtils";
import { formatSavedAt } from "@/lib/companySavedRecommendations";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

type Props = {
  item: CompanySavedStudentRecommendation;
  removing: boolean;
  onRemove: () => void;
  onNoteSave: (note: string | null) => Promise<void>;
};

export function CompanySavedStudentCard({ item, removing, onRemove, onNoteSave }: Props) {
  const colors = useCompanyTheme();
  const savedDate = formatSavedAt(item.savedAt);

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
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontWeight: "800", fontSize: 14, color: colors.accent }}>
            {studentInitials(item.studentName)}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }} numberOfLines={2}>
            {item.studentName}
          </Text>
          {item.major ? (
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
              {item.major}
            </Text>
          ) : null}
          {item.university ? (
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }} numberOfLines={1}>
              {item.university}
            </Text>
          ) : null}
        </View>
        {item.matchScore != null ? <CompanyMatchScoreRing score={item.matchScore} size={44} /> : null}
      </View>

      {item.reasonSummary ? (
        <View
          style={{
            padding: HOME_SPACE.sm,
            borderRadius: COMPANY_RADIUS.md,
            backgroundColor: colors.cardBg,
          }}
        >
          <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSecondary }} numberOfLines={3}>
            {item.reasonSummary}
          </Text>
        </View>
      ) : null}

      <CompanyStudentContactRows contact={item} compact />

      <Text style={{ fontSize: 11, color: colors.muted }}>
        Saved by {item.savedByName}
        {savedDate ? ` · ${savedDate}` : ""}
      </Text>

      <CompanySavedRecommendationNoteField value={item.note} onSave={onNoteSave} />

      <View style={{ flexDirection: "row", gap: HOME_SPACE.sm, marginTop: 4 }}>
        <Pressable
          onPress={() =>
            router.push(
              COMPANY_ROUTES.studentDiscoveryProfile(item.companyRequestId, item.studentProfileId) as Href,
            )
          }
          style={({ pressed }) => ({
            flex: 1,
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
          <Mail size={15} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>View profile</Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          disabled={removing}
          accessibilityLabel="Remove saved student"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: COMPANY_RADIUS.md,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: removing ? 0.5 : pressed ? 0.88 : 1,
          })}
        >
          {removing ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <Trash2 size={17} color="#DC2626" strokeWidth={2.2} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
