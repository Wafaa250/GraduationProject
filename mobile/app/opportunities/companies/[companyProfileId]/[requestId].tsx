import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getPublicCompanyOpportunity,
  type PublicCompanyOpportunityDetail,
} from "@/api/publicProfilesApi";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";

export default function CompanyOpportunityDetailScreen() {
  const { companyProfileId, requestId } = useLocalSearchParams<{
    companyProfileId: string;
    requestId: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opportunity, setOpportunity] = useState<PublicCompanyOpportunityDetail | null>(null);

  useEffect(() => {
    const companyId = Number(companyProfileId);
    const reqId = Number(requestId);
    if (!Number.isFinite(companyId) || !Number.isFinite(reqId)) {
      setError("Invalid opportunity link.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        setOpportunity(await getPublicCompanyOpportunity(companyId, reqId));
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [companyProfileId, requestId]);

  const openUrl = (url?: string | null) => {
    const trimmed = url?.trim();
    if (!trimmed) return;
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    void Linking.openURL(href);
  };

  if (loading) {
    return (
      <PublicProfileShell title="Opportunity" fallbackHref="/feed">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !opportunity) {
    return (
      <PublicProfileShell title="Opportunity" fallbackHref="/feed">
        <Text style={styles.error}>{error ?? "Opportunity not found."}</Text>
      </PublicProfileShell>
    );
  }

  const meta = [opportunity.category, opportunity.collaborationFormat, opportunity.durationLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <PublicProfileShell title={opportunity.title} fallbackHref="/feed">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.company}>
          {opportunity.companyName}
          {opportunity.industry ? ` · ${opportunity.industry}` : ""}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <Text style={styles.description}>{opportunity.description}</Text>

        {opportunity.skills.length > 0 ? (
          <View style={styles.tags}>
            {opportunity.skills.map((skill) => (
              <View key={skill} style={styles.tag}>
                <Text style={styles.tagText}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {opportunity.roles.length > 0 ? (
          <HubSectionCard title="Roles">
            {opportunity.roles.map((role) => (
              <View key={role.roleName} style={styles.roleBlock}>
                <Text style={styles.roleTitle}>{role.roleName}</Text>
                {role.skills.length > 0 ? (
                  <Text style={styles.roleSkills}>{role.skills.join(", ")}</Text>
                ) : null}
              </View>
            ))}
          </HubSectionCard>
        ) : null}

        <HubSectionCard title="Contact">
          {opportunity.contactEmail ? (
            <Text style={styles.link} onPress={() => openUrl(`mailto:${opportunity.contactEmail}`)}>
              {opportunity.contactEmail}
            </Text>
          ) : null}
          {opportunity.websiteUrl ? (
            <Text style={styles.link} onPress={() => openUrl(opportunity.websiteUrl)}>
              Visit website
            </Text>
          ) : null}
          {opportunity.linkedInUrl ? (
            <Text style={styles.link} onPress={() => openUrl(opportunity.linkedInUrl)}>
              LinkedIn
            </Text>
          ) : null}
        </HubSectionCard>
      </ScrollView>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 24 },
  error: { color: "#DC2626", lineHeight: 22 },
  company: { fontSize: 12, fontWeight: "700", color: HUB_COLORS.muted, textTransform: "uppercase" },
  meta: { color: HUB_COLORS.muted, fontSize: 14 },
  description: { color: HUB_COLORS.foreground, lineHeight: 22, fontSize: 15 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: HUB_COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { color: HUB_COLORS.primary, fontWeight: "600", fontSize: 12 },
  roleBlock: { gap: 4, marginBottom: 12 },
  roleTitle: { fontWeight: "700", color: HUB_COLORS.foreground },
  roleSkills: { color: HUB_COLORS.muted, fontSize: 13 },
  link: { color: HUB_COLORS.primary, fontWeight: "600", marginBottom: 8 },
});
