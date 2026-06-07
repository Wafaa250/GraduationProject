import { router, type Href } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { CompanyProjectRequestSummary } from "@/api/companyApi";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { createRequestStyles } from "@/components/company/requests/requestStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import {
  formatCollaborationLine,
  formatRequestDate,
  formatRequestDuration,
  getRequestLifecycleStatus,
  getRequestProjectTitle,
  getRequestRoleLabels,
  getRequestSkillLabels,
  isRequestViewOnly,
  requestHubVisibilityColors,
  requestHubVisibilityLabel,
  requestTypeLabel,
} from "@/lib/companyRequestDisplay";

type Props = {
  request: CompanyProjectRequestSummary;
};

export function CompanyRequestListCard({ request }: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createRequestStyles(colors), [colors]);
  const title = getRequestProjectTitle(request);
  const roles = getRequestRoleLabels(request);
  const skills = getRequestSkillLabels(request);
  const lifecycle = getRequestLifecycleStatus(request);
  const viewOnly = isRequestViewOnly(lifecycle);
  const hubColors = requestHubVisibilityColors(request);

  const meta = [
    formatRequestDuration(request),
    request.collaborationType ? formatCollaborationLine(request.collaborationType) : null,
    request.createdAt ? `Created ${formatRequestDate(request.createdAt)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <Text style={{ flex: 1, minWidth: "60%", fontSize: 17, fontWeight: "700", color: colors.foreground }} numberOfLines={2}>
          {title}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{requestTypeLabel(request.requestType)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors[hubColors.bg] }]}>
          <Text style={[styles.badgeText, { color: colors[hubColors.text] }]}>{requestHubVisibilityLabel(request)}</Text>
        </View>
      </View>

      {roles.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <Text style={styles.sectionLabel}>Roles</Text>
          <View style={styles.chipWrap}>
            {roles.map((role) => (
              <View key={role} style={styles.chip}>
                <Text style={styles.chipText}>{role}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {skills.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <Text style={styles.sectionLabel}>Skills</Text>
          <View style={styles.chipWrap}>
            {skills.slice(0, 8).map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillChipText}>{skill}</Text>
              </View>
            ))}
            {skills.length > 8 ? (
              <View style={styles.skillChip}>
                <Text style={styles.skillChipText}>+{skills.length - 8}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {meta ? <Text style={[styles.metaText, { marginTop: 14 }]}>{meta}</Text> : null}

      <View style={{ marginTop: HOME_SPACE.lg, gap: 10 }}>
        <Pressable
          onPress={() => router.push(COMPANY_ROUTES.requestDetail(request.id) as Href)}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.secondaryBtnText}>View Details</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(COMPANY_ROUTES.requestRecommendations(request.id) as Href)}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
        >
          <Sparkles size={16} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.primaryBtnText}>{viewOnly ? "View Recommendations" : "AI Recommendations"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
