import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import {
  getCompanyProfile,
  listCompanyTalentRequests,
  parseApiErrorMessage,
  type CompanyProfile,
  type CompanyTalentRequestSummary,
} from "@/api/companyApi";
import { CompanyScreenHeader } from "@/components/company/CompanyScreenHeader";
import { companyColors } from "@/constants/companyTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { clearSession, getItem } from "@/utils/authStorage";

export default function CompanyDashboardScreen() {
  const layout = useResponsiveLayout();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [requests, setRequests] = useState<CompanyTalentRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [fallbackName, setFallbackName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        getCompanyProfile(),
        listCompanyTalentRequests().catch(() => [] as CompanyTalentRequestSummary[]),
      ]);
      setProfile(p);
      setRequests(r);
    } catch (e) {
      console.warn(parseApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setFallbackName(((await getItem("name")) ?? "").trim());
    })();
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await clearSession();
    router.replace("/login" as Href);
  };

  const name = profile?.companyName || fallbackName || "Company";

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <CompanyScreenHeader
        title={name}
        subtitle="Company workspace"
        right={
          <Pressable onPress={() => void logout()} hitSlop={10} accessibilityLabel="Log out">
            <Ionicons name="log-out-outline" size={22} color={companyColors.accentDark} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={companyColors.accent} size="large" />
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Welcome back</Text>
              <Text style={styles.heroTitle}>Find the right student</Text>
              <Text style={styles.heroBody}>
                Describe who you need. SkillSwap AI ranks students by skills, major, and profile.
              </Text>
              <Pressable
                style={styles.cta}
                onPress={() => router.push("/company/talent-search" as Href)}
              >
                <Text style={styles.ctaText}>✨ Start AI talent search</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Industry</Text>
                <Text style={styles.statValue}>{profile?.industry?.trim() || "—"}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Recent searches</Text>
                <Text style={styles.statValue}>{String(requests.length)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent talent searches</Text>
              {requests.length === 0 ? (
                <Text style={styles.empty}>No searches yet. Create your first AI talent search.</Text>
              ) : (
                requests.map((r) => (
                  <View key={r.id} style={styles.requestRow}>
                    <Text style={styles.requestTitle}>{r.title}</Text>
                    <Text style={styles.requestMeta} numberOfLines={2}>
                      {r.engagementType ? `${r.engagementType} · ` : ""}
                      {r.requiredSkills.slice(0, 4).join(", ")}
                      {r.requiredSkills.length > 4 ? "…" : ""}
                    </Text>
                    <Text style={styles.requestDate}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: companyColors.bg },
  center: { paddingVertical: 48, alignItems: "center" },
  hero: {
    backgroundColor: companyColors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: companyColors.accentBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroLabel: { fontSize: 13, fontWeight: "700", color: companyColors.accent, marginBottom: 6 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: companyColors.text, marginBottom: 8 },
  heroBody: { fontSize: 14, lineHeight: 21, color: companyColors.muted, marginBottom: spacing.lg },
  cta: {
    backgroundColor: companyColors.accent,
    borderRadius: radius.lg,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  stat: {
    flex: 1,
    backgroundColor: companyColors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: companyColors.border,
    padding: spacing.md,
  },
  statLabel: { fontSize: 12, fontWeight: "600", color: companyColors.muted, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800", color: companyColors.text },
  card: {
    backgroundColor: companyColors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: companyColors.border,
    padding: spacing.lg,
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: companyColors.text, marginBottom: spacing.md },
  empty: { fontSize: 14, color: companyColors.muted, lineHeight: 20 },
  requestRow: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: companyColors.border,
  },
  requestTitle: { fontSize: 15, fontWeight: "700", color: companyColors.text, marginBottom: 4 },
  requestMeta: { fontSize: 12, color: companyColors.muted, marginBottom: 4 },
  requestDate: { fontSize: 12, color: "#94a3b8" },
});
