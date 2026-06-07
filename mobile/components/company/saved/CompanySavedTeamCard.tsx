import { router, type Href } from "expo-router";
import { Sparkles, Trash2, UsersRound } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { CompanySavedTeamRecommendation } from "@/api/companyApi";
import { CompanyMatchScoreRing } from "@/components/company/CompanyMatchScoreRing";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanySavedRecommendationNoteField } from "@/components/company/saved/CompanySavedRecommendationNoteField";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { formatSavedAt } from "@/lib/companySavedRecommendations";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

type Props = {
  item: CompanySavedTeamRecommendation;
  removing: boolean;
  onRemove: () => void;
  onNoteSave: (note: string | null) => Promise<void>;
};

export function CompanySavedTeamCard({ item, removing, onRemove, onNoteSave }: Props) {
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
            borderRadius: COMPANY_RADIUS.md,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UsersRound size={20} color={colors.accent} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
            Team #{item.teamRank}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {item.memberCount} members · {item.roleCoverageScore}% role coverage
          </Text>
        </View>
        <CompanyMatchScoreRing score={item.totalScore} size={44} />
      </View>

      {item.summaryReason ? (
        <View
          style={{
            padding: HOME_SPACE.sm,
            borderRadius: COMPANY_RADIUS.md,
            backgroundColor: colors.cardBg,
          }}
        >
          <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSecondary }} numberOfLines={3}>
            {item.summaryReason}
          </Text>
        </View>
      ) : null}

      {item.memberNames.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {item.memberNames.slice(0, 5).map((name) => (
            <View
              key={name}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: COMPANY_RADIUS.pill,
                backgroundColor: colors.accentSoft,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent }}>{name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={{ fontSize: 11, color: colors.muted }}>
        Saved by {item.savedByName}
        {savedDate ? ` · ${savedDate}` : ""}
      </Text>

      <CompanySavedRecommendationNoteField value={item.note} onSave={onNoteSave} />

      <View style={{ flexDirection: "row", gap: HOME_SPACE.sm, marginTop: 4 }}>
        <Pressable
          onPress={() =>
            router.push(
              COMPANY_ROUTES.teamDiscoveryProfile(item.companyRequestId, item.teamRecommendationId) as Href,
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
          <Sparkles size={15} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>View team</Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          disabled={removing}
          accessibilityLabel="Remove saved team"
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
