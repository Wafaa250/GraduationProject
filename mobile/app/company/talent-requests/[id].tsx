import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getPublicCompanyTalentRequest,
  type PublicCompanyTalentRequestDetail,
} from "@/api/publicProfilesApi";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";

export default function CompanyTalentRequestDetailScreen() {
  const { id, companyId } = useLocalSearchParams<{ id: string; companyId?: string }>();
  const talentRequestId = Number(id);
  const companyProfileId = Number(companyId ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<PublicCompanyTalentRequestDetail | null>(null);

  useEffect(() => {
    if (!Number.isFinite(talentRequestId) || companyProfileId <= 0) {
      setError("Invalid talent request link.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        setItem(await getPublicCompanyTalentRequest(companyProfileId, talentRequestId));
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [talentRequestId, companyProfileId]);

  if (loading) {
    return (
      <PublicProfileShell title="Talent Request" fallbackHref="/feed">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !item) {
    return (
      <PublicProfileShell title="Talent Request" fallbackHref="/feed">
        <Text style={styles.error}>{error ?? "Talent request not found."}</Text>
      </PublicProfileShell>
    );
  }

  const meta = [item.engagementType, item.duration, item.preferredMajor].filter(Boolean).join(" · ");

  return (
    <PublicProfileShell title={item.title} fallbackHref="/feed">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.company}>
          {item.companyName}
          {item.industry ? ` · ${item.industry}` : ""}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <Text style={styles.description}>{item.description}</Text>

        {item.skills.length > 0 ? (
          <HubSectionCard title="Skills">
            <View style={styles.tags}>
              {item.skills.map((skill) => (
                <View key={skill} style={styles.tag}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </HubSectionCard>
        ) : null}
      </ScrollView>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 14, paddingBottom: 24 },
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
});
