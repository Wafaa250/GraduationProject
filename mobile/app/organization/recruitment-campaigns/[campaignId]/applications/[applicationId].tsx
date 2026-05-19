import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getOrganizationRecruitmentApplication,
  type RecruitmentApplicationDetail,
} from "@/api/recruitmentApplicationsApi";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function OrganizationRecruitmentApplicationDetailScreen() {
  const layout = useResponsiveLayout();
  const { campaignId, applicationId } = useLocalSearchParams<{
    campaignId: string;
    applicationId: string;
  }>();
  const cId = Number(campaignId);
  const aId = Number(applicationId);
  const [detail, setDetail] = useState<RecruitmentApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(cId) || !Number.isFinite(aId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrganizationRecruitmentApplication(cId, aId);
      setDetail(data);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [cId, aId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Application" onBack={() => router.back()} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={assocColors.accent} size="large" />
        </View>
      ) : !detail ? (
        <Text style={styles.err}>Application not found.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: spacing.xxxl,
            paddingTop: spacing.md,
          }}
        >
          <Text style={styles.kicker}>{detail.campaignTitle}</Text>
          <Text style={styles.title}>{detail.positionRoleTitle}</Text>
          <View style={styles.row}>
            <Ionicons name="person-circle-outline" size={18} color={assocColors.muted} />
            <Text style={styles.student}>{detail.studentName}</Text>
          </View>
          <View style={styles.meta}>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{detail.status}</Text>
            </View>
          </View>
          {detail.studentMajor?.trim() ? (
            <Text style={styles.sub}>Major: {detail.studentMajor}</Text>
          ) : null}
          {detail.studentAcademicYear?.trim() ? (
            <Text style={styles.sub}>Year: {detail.studentAcademicYear}</Text>
          ) : null}

          <Text style={styles.section}>Responses</Text>
          {detail.answers.map((ans) => (
            <View key={ans.questionId} style={styles.qCard}>
              <Text style={styles.qTitle}>{ans.questionTitle}</Text>
              <Text style={styles.qBody}>{ans.answerValue}</Text>
            </View>
          ))}

          <View style={{ height: spacing.lg }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { textAlign: "center", marginTop: 24, color: assocColors.muted },
  kicker: { fontSize: 12, fontWeight: "800", color: assocColors.accentDark, textTransform: "uppercase" },
  title: { marginTop: 6, fontSize: 22, fontWeight: "900", color: assocColors.text },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.md },
  student: { fontSize: 16, fontWeight: "800", color: assocColors.text },
  meta: { flexDirection: "row", marginTop: spacing.sm },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  badgeTxt: { fontSize: 12, fontWeight: "800", color: assocColors.accentDark },
  sub: { marginTop: spacing.xs, fontSize: 14, color: assocColors.muted, fontWeight: "600" },
  section: { marginTop: spacing.xl, fontSize: 16, fontWeight: "900", color: assocColors.text },
  qCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    backgroundColor: assocColors.surface,
  },
  qTitle: { fontSize: 13, fontWeight: "800", color: assocColors.subtle, textTransform: "uppercase" },
  qBody: { marginTop: spacing.sm, fontSize: 15, lineHeight: 22, color: assocColors.text, fontWeight: "600" },
});
