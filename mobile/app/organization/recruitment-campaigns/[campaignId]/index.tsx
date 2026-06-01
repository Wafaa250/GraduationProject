import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  analyzeRecruitmentApplicants,
  type RecruitmentApplicantAnalysisResponse,
  type RecruitmentApplicantAnalysisResult,
} from "@/api/recruitmentApplicationsApi";
import {
  deleteOrganizationRecruitmentCampaign,
  getOrganizationRecruitmentCampaign,
  parseSkillsList,
  type RecruitmentCampaign,
} from "@/api/organizationRecruitmentCampaignsApi";
import { sortByLeadershipRole } from "@/utils/leadershipRoleSort";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { formatEventDate } from "@/utils/eventFormUtils";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

function aiCardKey(positionId: number, applicationId: number) {
  return `${positionId}-${applicationId}`;
}

export default function OrganizationRecruitmentCampaignDetailsScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const layout = useResponsiveLayout();
  const id = Number(campaignId);
  const [campaign, setCampaign] = useState<RecruitmentCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiByPosition, setAiByPosition] = useState<Record<number, RecruitmentApplicantAnalysisResponse | undefined>>({});
  const [aiAnalyzingPositionId, setAiAnalyzingPositionId] = useState<number | null>(null);
  const [expandedAiKey, setExpandedAiKey] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0.35)).current;

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrganizationRecruitmentCampaign(id);
      setCampaign(data);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (aiAnalyzingPositionId == null) {
      pulse.setValue(0.35);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [aiAnalyzingPositionId, pulse]);

  const cover = campaign?.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null;
  const positions = sortByLeadershipRole(campaign?.positions ?? []);

  const confirmDelete = () => {
    if (!campaign) return;
    Alert.alert("Delete campaign", `Delete "${campaign.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void doDelete() },
    ]);
  };

  const doDelete = async () => {
    if (!campaign) return;
    try {
      await deleteOrganizationRecruitmentCampaign(campaign.id);
      router.replace("/organization/recruitment-campaigns" as Href);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    }
  };

  const runAiAnalyze = async (positionId: number) => {
    if (!campaign || !Number.isFinite(id)) return;
    setAiAnalyzingPositionId(positionId);
    try {
      const data = await analyzeRecruitmentApplicants(campaign.id, positionId);
      setAiByPosition((prev) => ({ ...prev, [positionId]: data }));
    } catch (e) {
      Alert.alert("Analysis failed", parseApiErrorMessage(e));
    } finally {
      setAiAnalyzingPositionId(null);
    }
  };

  const toggleExpand = (positionId: number, r: RecruitmentApplicantAnalysisResult) => {
    const key = aiCardKey(positionId, r.applicationId);
    setExpandedAiKey((prev) => (prev === key ? null : key));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Campaign details" onBack={() => router.back()} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={assocColors.accent} size="large" />
        </View>
      ) : !campaign ? (
        <Text style={styles.err}>Campaign not found.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: spacing.xxxl,
            paddingTop: spacing.md,
          }}
        >
          <View style={styles.coverWrap}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.cover} contentFit="cover" />
            ) : (
              <View style={styles.coverPh}>
                <Ionicons name="megaphone-outline" size={36} color={assocColors.accent} />
              </View>
            )}
          </View>
          {!campaign.isPublished ? (
            <View style={styles.draftBadge}>
              <Text style={styles.draftTxt}>Draft</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{campaign.title}</Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={16} color={assocColors.muted} />
            <Text style={styles.metaTxt}>Apply by {formatEventDate(campaign.applicationDeadline)}</Text>
          </View>

          <Text style={styles.section}>Description</Text>
          <Text style={styles.body}>{campaign.description}</Text>

          <Text style={styles.section}>Required positions ({positions.length})</Text>
          {positions.map((p) => {
            const skills = parseSkillsList(p.requiredSkills);
            const analysis = aiByPosition[p.id];
            const expandedFor = (r: RecruitmentApplicantAnalysisResult) =>
              expandedAiKey === aiCardKey(p.id, r.applicationId);
            return (
              <View key={p.id} style={styles.posCard}>
                <View style={styles.posHead}>
                  <Text style={styles.posTitle}>{p.roleTitle}</Text>
                  <View style={styles.countBadge}>
                    <Ionicons name="people" size={14} color={assocColors.accentDark} />
                    <Text style={styles.countTxt}>{p.neededCount} needed</Text>
                  </View>
                </View>
                {p.description?.trim() ? <Text style={styles.body}>{p.description}</Text> : null}
                {p.requirements?.trim() ? (
                  <>
                    <Text style={styles.posLabel}>Requirements</Text>
                    <Text style={styles.body}>{p.requirements}</Text>
                  </>
                ) : null}
                {skills.length > 0 ? (
                  <>
                    <Text style={styles.posLabel}>Skills</Text>
                    <View style={styles.chips}>
                      {skills.map((s) => (
                        <View key={s} style={styles.chip}>
                          <Text style={styles.chipTxt}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}

                <Pressable
                  style={[styles.aiBtn, aiAnalyzingPositionId === p.id && styles.aiBtnBusy]}
                  onPress={() => void runAiAnalyze(p.id)}
                  disabled={aiAnalyzingPositionId === p.id}
                >
                  {aiAnalyzingPositionId === p.id ? (
                    <ActivityIndicator color={assocColors.accentDark} size="small" />
                  ) : (
                    <Ionicons name="sparkles" size={18} color={assocColors.accentDark} />
                  )}
                  <Text style={styles.aiBtnTxt}>
                    {aiAnalyzingPositionId === p.id ? "Analyzing applicants…" : "Analyze applicants with AI"}
                  </Text>
                </Pressable>
                {aiAnalyzingPositionId === p.id ? (
                  <Animated.View style={[styles.aiPulseBar, { opacity: pulse }]} />
                ) : null}

                {analysis ? (
                  <View style={styles.aiResults}>
                    <Text style={styles.aiResultsTitle}>AI matches</Text>
                    {analysis.results.length === 0 ? (
                      <Text style={styles.aiEmpty}>No submitted applications for this position yet.</Text>
                    ) : (
                      analysis.results.map((r, idx) => {
                        const open = expandedFor(r);
                        return (
                          <View key={aiCardKey(p.id, r.applicationId)} style={styles.aiMatchCard}>
                            <Pressable onPress={() => toggleExpand(p.id, r)} style={styles.aiMatchHead}>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <View style={styles.rankRow}>
                                  {idx === 0 ? (
                                    <View style={styles.topPick}>
                                      <Text style={styles.topPickTxt}>Top pick</Text>
                                    </View>
                                  ) : null}
                                </View>
                                <Text style={styles.aiName}>{r.studentName}</Text>
                                <Text style={styles.aiSub} numberOfLines={open ? undefined : 1}>
                                  {[r.faculty, r.major].filter(Boolean).join(" · ") || "—"}
                                </Text>
                              </View>
                              <View style={styles.scoreWrap}>
                                <Text style={styles.scoreVal}>{r.matchScore}%</Text>
                                <Text style={styles.scoreLbl}>match</Text>
                                <Ionicons
                                  name={open ? "chevron-up" : "chevron-down"}
                                  size={18}
                                  color={assocColors.muted}
                                />
                              </View>
                            </Pressable>
                            {open ? (
                              <View style={styles.aiExpand}>
                                {r.strengths.length > 0 ? (
                                  <>
                                    <Text style={styles.expandLbl}>Strengths</Text>
                                    {r.strengths.map((s) => (
                                      <Text key={s} style={styles.expandLi}>
                                        • {s}
                                      </Text>
                                    ))}
                                  </>
                                ) : null}
                                {r.concerns.length > 0 ? (
                                  <>
                                    <Text style={[styles.expandLbl, { marginTop: spacing.sm }]}>Concerns</Text>
                                    {r.concerns.map((c) => (
                                      <Text key={c} style={styles.expandConcern}>
                                        • {c}
                                      </Text>
                                    ))}
                                  </>
                                ) : null}
                                <Text style={styles.expandReason}>{r.reason}</Text>
                                <View style={styles.aiActions}>
                                  <Pressable
                                    style={styles.aiGhost}
                                    onPress={() =>
                                      router.push(
                                        `/organization/recruitment-campaigns/${campaign.id}/applications/${r.applicationId}` as Href,
                                      )
                                    }
                                  >
                                    <Ionicons name="document-text-outline" size={16} color={assocColors.accentDark} />
                                    <Text style={styles.aiGhostTxt}>Full application</Text>
                                  </Pressable>
                                  <Pressable
                                    style={styles.aiPrimary}
                                    onPress={() =>
                                      router.push(
                                        `/StudentPublicProfilePage?userId=${encodeURIComponent(String(r.studentUserId))}` as Href,
                                      )
                                    }
                                  >
                                    <Ionicons name="person-outline" size={16} color="#fff" />
                                    <Text style={styles.aiPrimaryTxt}>Profile</Text>
                                  </Pressable>
                                </View>
                              </View>
                            ) : (
                              <Text style={styles.tapHint} numberOfLines={2}>
                                Tap for AI explanation and actions
                              </Text>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}

          <View style={styles.actions}>
            <Pressable
              style={styles.secondary}
              onPress={() => router.push(`/organization/recruitment-campaigns/${campaign.id}/edit` as Href)}
            >
              <Ionicons name="pencil" size={18} color={assocColors.accentDark} />
              <Text style={styles.secondaryTxt}>Edit</Text>
            </Pressable>
            <Pressable style={styles.danger} onPress={confirmDelete}>
              <Ionicons name="trash" size={18} color="#fff" />
              <Text style={styles.dangerTxt}>Delete</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { textAlign: "center", marginTop: 24, color: assocColors.muted },
  coverWrap: {
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: assocColors.border,
    marginBottom: spacing.md,
  },
  cover: { width: "100%", height: 160, backgroundColor: assocColors.bg },
  coverPh: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.accentMuted,
  },
  draftBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    marginBottom: spacing.sm,
  },
  draftTxt: { fontSize: 11, fontWeight: "800", color: assocColors.accentDark },
  title: { fontSize: 24, fontWeight: "900", color: assocColors.text, lineHeight: 30 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm },
  metaTxt: { flex: 1, fontSize: 14, color: assocColors.muted, fontWeight: "600" },
  section: { marginTop: spacing.xl, fontSize: 16, fontWeight: "900", color: assocColors.text },
  body: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: assocColors.text,
    fontWeight: "500",
  },
  posCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  posHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  posTitle: { flex: 1, fontSize: 17, fontWeight: "900", color: assocColors.text },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  countTxt: { fontSize: 12, fontWeight: "800", color: assocColors.accentDark },
  posLabel: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: "800",
    color: assocColors.subtle,
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  chipTxt: { fontSize: 12, fontWeight: "700", color: assocColors.accentDark },
  aiBtn: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#c2410c22",
    backgroundColor: "#fff7ed",
  },
  aiBtnBusy: { opacity: 0.9 },
  aiBtnTxt: { fontSize: 14, fontWeight: "900", color: assocColors.accentDark },
  aiPulseBar: {
    marginTop: spacing.sm,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#ea580c",
  },
  aiResults: { marginTop: spacing.lg },
  aiResultsTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: assocColors.subtle,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  aiEmpty: { fontSize: 13, color: assocColors.muted, fontWeight: "600" },
  aiMatchCard: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: "#fffefb",
    overflow: "hidden",
  },
  aiMatchHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
  },
  rankRow: { flexDirection: "row", marginBottom: 4 },
  topPick: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#0f172a",
  },
  topPickTxt: { fontSize: 10, fontWeight: "900", color: "#fff", textTransform: "uppercase" },
  aiName: { fontSize: 16, fontWeight: "900", color: assocColors.text },
  aiSub: { marginTop: 4, fontSize: 13, color: assocColors.muted, fontWeight: "600" },
  scoreWrap: { alignItems: "flex-end", gap: 2 },
  scoreVal: { fontSize: 20, fontWeight: "900", color: "#c2410c" },
  scoreLbl: { fontSize: 10, fontWeight: "800", color: assocColors.muted, textTransform: "uppercase" },
  aiExpand: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  expandLbl: { fontSize: 11, fontWeight: "900", color: assocColors.subtle, textTransform: "uppercase" },
  expandLi: { marginTop: 4, fontSize: 13, color: assocColors.text, fontWeight: "600", lineHeight: 18 },
  expandConcern: { marginTop: 4, fontSize: 13, color: "#b45309", fontWeight: "600", lineHeight: 18 },
  expandReason: {
    marginTop: spacing.md,
    fontSize: 14,
    lineHeight: 21,
    color: assocColors.text,
    fontWeight: "600",
    fontStyle: "italic",
  },
  tapHint: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, fontSize: 12, color: assocColors.muted },
  aiActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  aiGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.surface,
  },
  aiGhostTxt: { fontWeight: "800", color: assocColors.accentDark, fontSize: 13 },
  aiPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: "#ea580c",
  },
  aiPrimaryTxt: { fontWeight: "900", color: "#fff", fontSize: 13 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
  },
  secondaryTxt: { fontWeight: "900", color: assocColors.accentDark, fontSize: 15 },
  danger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: "#dc2626",
  },
  dangerTxt: { fontWeight: "900", color: "#fff", fontSize: 15 },
});
