import { router, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { CompanyDashboardRequestPreview } from "@/api/companyApi";
import { createCompanyHomeStyles, HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { formatDashboardDate } from "@/lib/companyDashboardUtils";
import {
  requestLifecycleStatusColors,
  requestLifecycleStatusLabel,
} from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

type Props = {
  request: CompanyDashboardRequestPreview;
  showDivider?: boolean;
};

export function CompanyActiveRequestCard({ request, showDivider }: Props) {
  const colors = useCompanyTheme();
  const styles = createCompanyHomeStyles(colors);
  const statusColors = requestLifecycleStatusColors(request.status);
  const badgeBg = colors[statusColors.bg];
  const badgeText = colors[statusColors.text];
  const title = request.title?.trim() || "Untitled project request";

  return (
    <View
      style={{
        paddingVertical: HOME_SPACE.lg,
        paddingHorizontal: HOME_SPACE.lg,
        borderTopWidth: showDivider ? 1 : 0,
        borderTopColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, flexShrink: 1 }} numberOfLines={2}>
          {title}
        </Text>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: COMPANY_RADIUS.pill,
            backgroundColor: badgeBg,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: badgeText }}>
            {requestLifecycleStatusLabel(request.status)}
          </Text>
        </View>
      </View>

      {request.requestedRole && request.requestedRole !== "—" ? (
        <Text style={{ marginTop: 6, fontSize: 14, color: colors.textSecondary }} numberOfLines={1}>
          {request.requestedRole}
        </Text>
      ) : null}

      <Text style={{ marginTop: 8, fontSize: 12, color: colors.muted }}>
        Created {formatDashboardDate(request.createdAt)}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: HOME_SPACE.md, gap: HOME_SPACE.xl }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>
            {request.savedStudentsCount}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted, letterSpacing: 0.8 }}>
            STUDENTS
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>
            {request.savedTeamsCount}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted, letterSpacing: 0.8 }}>
            TEAMS
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push(COMPANY_ROUTES.requestDetail(request.id) as Href)}
        style={({ pressed }) => [styles.outlineBtn, { alignSelf: "flex-start", marginTop: HOME_SPACE.md, opacity: pressed ? 0.9 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`View request ${title}`}
      >
        <Text style={styles.outlineBtnText}>View Request</Text>
      </Pressable>
    </View>
  );
}
