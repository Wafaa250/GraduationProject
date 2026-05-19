import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";

import type { CompanyTalentCandidate, CompanyTalentSearchResult } from "@/api/companyApi";
import { getCompanyProfile } from "@/api/companyApi";
import { CompanyBackLink, CompanyScreenHeader } from "@/components/company/CompanyScreenHeader";
import { companyColors } from "@/constants/companyTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { loadTalentSearchState } from "@/utils/companyTalentSearchStorage";

export default function CompanyTalentResultsScreen() {
  const layout = useResponsiveLayout();
  const [companyName, setCompanyName] = useState("Company");
  const [result, setResult] = useState<CompanyTalentSearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const state = await loadTalentSearchState();
      setResult(state?.result ?? null);
      setLoading(false);
    })();
    getCompanyProfile()
      .then((p) => setCompanyName(p.companyName))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && !result) {
      router.replace("/company/talent-search" as Href);
    }
  }, [loading, result]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator color={companyColors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!result) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <CompanyScreenHeader title="Recommended students" subtitle="AI Talent Search" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl,
        }}
      >
        <CompanyBackLink label="Back to search" onPress={() => router.back()} />
        <Text style={styles.meta}>
          {result.usedAi ? "Ranked by SkillSwap AI" : "Ranked by skill overlap"} · {result.title}
        </Text>
        <Text style={styles.count}>
          {result.candidates.length} recommended candidate{result.candidates.length !== 1 ? "s" : ""}
        </Text>

        {result.candidates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No students met the minimum match threshold. Try broadening skills or removing the major filter.
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.link}>Adjust search</Text>
            </Pressable>
          </View>
        ) : (
          result.candidates.map((c, idx) => (
            <CandidateCard key={c.studentProfileId} candidate={c} rank={idx + 1} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CandidateCard({ candidate, rank }: { candidate: CompanyTalentCandidate; rank: number }) {
  const scoreColor =
    candidate.matchScore >= 75 ? "#059669" : candidate.matchScore >= 55 ? "#d97706" : "#64748b";

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.rank}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name}>{candidate.name}</Text>
          <Text style={[styles.badge, { color: scoreColor, borderColor: `${scoreColor}44` }]}>
            {candidate.matchScore}% match
          </Text>
          <Text style={styles.metaLine}>
            {candidate.major || "Major not set"} · {candidate.university}
            {candidate.academicYear ? ` · Year ${candidate.academicYear}` : ""}
          </Text>
        </View>
      </View>
      {candidate.skills.length > 0 ? (
        <View style={styles.skills}>
          {candidate.skills.slice(0, 6).map((sk) => (
            <Text key={sk} style={styles.skill}>
              {sk}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.reason}>
        <Text style={styles.reasonTitle}>Why this student?</Text>
        <Text style={styles.reasonBody}>{candidate.reason}</Text>
      </View>
      {candidate.highlights.length > 0 ? (
        <View style={styles.highlights}>
          {candidate.highlights.map((h) => (
            <Text key={h} style={styles.highlight}>
              ✓ {h}
            </Text>
          ))}
        </View>
      ) : null}
      <Pressable
        style={styles.profileBtn}
        onPress={() => router.push(`/StudentPublicProfilePage?userId=${candidate.userId}` as Href)}
      >
        <Text style={styles.profileBtnText}>View full profile →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: companyColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  meta: { fontSize: 14, color: companyColors.muted, lineHeight: 20, marginBottom: spacing.sm },
  count: { fontSize: 17, fontWeight: "800", color: companyColors.text, marginBottom: spacing.lg },
  emptyCard: {
    backgroundColor: companyColors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: companyColors.border,
    alignItems: "center",
  },
  emptyText: { textAlign: "center", color: companyColors.muted, lineHeight: 21, marginBottom: spacing.md },
  link: { color: companyColors.accentDark, fontWeight: "800" },
  card: {
    backgroundColor: companyColors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: companyColors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  rank: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: companyColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  name: { fontSize: 17, fontWeight: "800", color: companyColors.text, marginBottom: 4 },
  badge: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 6,
  },
  metaLine: { fontSize: 13, color: companyColors.muted, lineHeight: 18 },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.md },
  skill: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: companyColors.accentMuted,
    color: companyColors.accentDark,
  },
  reason: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: spacing.sm,
  },
  reasonTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6, color: companyColors.text },
  reasonBody: { fontSize: 14, color: companyColors.muted, lineHeight: 20 },
  highlights: { marginBottom: spacing.md, gap: 4 },
  highlight: { fontSize: 13, color: companyColors.text, lineHeight: 19 },
  profileBtn: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: companyColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  profileBtnText: { fontWeight: "700", color: companyColors.accentDark, fontSize: 15 },
});
