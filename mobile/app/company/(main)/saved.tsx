import { router, useFocusEffect, type Href } from "expo-router";
import { Bookmark, ChevronRight, Sparkles } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  getCompanySavedRecommendations,
  parseApiErrorMessage,
  unsaveStudentRecommendation,
  unsaveTeamRecommendation,
  updateSavedStudentNote,
  updateSavedTeamNote,
  type CompanySavedStudentRecommendation,
  type CompanySavedTeamRecommendation,
} from "@/api/companyApi";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { CompanySavedRecommendationsEmptyState } from "@/components/company/saved/CompanySavedRecommendationsEmptyState";
import { CompanySavedStudentCard } from "@/components/company/saved/CompanySavedStudentCard";
import { CompanySavedTeamCard } from "@/components/company/saved/CompanySavedTeamCard";
import { CompanyWorkspaceToolbar } from "@/components/company/CompanyWorkspaceToolbar";
import { CompanyAccordionSection } from "@/components/company/ui/CompanyAccordionSection";
import { COMPANY_RADIUS, companyCardShadow } from "@/components/company/ui/companyDesignSystem";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { buildSavedRequestGroups, savedSummary } from "@/lib/companySavedRecommendations";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { COMPANY_SAVED_SUBTITLE } from "@/lib/companyWorkspaceCopy";

export default function CompanySavedScreen() {
  const colors = useCompanyTheme();
  const [students, setStudents] = useState<CompanySavedStudentRecommendation[]>([]);
  const [teams, setTeams] = useState<CompanySavedTeamRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);
  const [removingTeamId, setRemovingTeamId] = useState<number | null>(null);

  const groups = useMemo(() => buildSavedRequestGroups(students, teams), [students, teams]);
  const totalCount = students.length + teams.length;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getCompanySavedRecommendations();
      setStudents(data.students);
      setTeams(data.teams);
      setError(null);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(true); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const removeStudent = async (item: CompanySavedStudentRecommendation) => {
    setRemovingStudentId(item.id);
    try {
      await unsaveStudentRecommendation(item.companyRequestId, item.studentProfileId);
      setStudents((prev) => prev.filter((s) => s.id !== item.id));
    } catch (err) {
      Alert.alert("Could not remove", parseApiErrorMessage(err));
    } finally {
      setRemovingStudentId(null);
    }
  };

  const removeTeam = async (item: CompanySavedTeamRecommendation) => {
    setRemovingTeamId(item.id);
    try {
      await unsaveTeamRecommendation(item.companyRequestId, item.teamRecommendationId);
      setTeams((prev) => prev.filter((t) => t.id !== item.id));
    } catch (err) {
      Alert.alert("Could not remove", parseApiErrorMessage(err));
    } finally {
      setRemovingTeamId(null);
    }
  };

  const patchStudentNote = (item: CompanySavedStudentRecommendation, note: string | null) => {
    setStudents((prev) => prev.map((s) => (s.id === item.id ? { ...s, note } : s)));
    return updateSavedStudentNote(item.companyRequestId, item.studentProfileId, note);
  };

  const patchTeamNote = (item: CompanySavedTeamRecommendation, note: string | null) => {
    setTeams((prev) => prev.map((t) => (t.id === item.id ? { ...t, note } : t)));
    return updateSavedTeamNote(item.companyRequestId, item.teamRecommendationId, note);
  };

  return (
    <CompanyScreen edges={["top"]}>
      <CompanyWorkspaceToolbar />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
        }
        contentContainerStyle={{ padding: HOME_SPACE.lg, paddingBottom: HOME_SPACE.xxxl }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, letterSpacing: -0.6 }}>
          Saved Recommendations
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: HOME_SPACE.lg }}>
          {COMPANY_SAVED_SUBTITLE}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : error ? (
          <CompanyEmptyState icon={Bookmark} message={error} actionLabel="Retry" onAction={() => void load()} />
        ) : totalCount === 0 ? (
          <CompanySavedRecommendationsEmptyState />
        ) : (
          <>
            <View
              style={{
                flexDirection: "row",
                gap: HOME_SPACE.sm,
                marginBottom: HOME_SPACE.xl,
              }}
            >
              <View
                style={{
                  flex: 1,
                  padding: HOME_SPACE.md,
                  borderRadius: COMPANY_RADIUS.lg,
                  backgroundColor: colors.cardBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  ...companyCardShadow(colors),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Bookmark size={14} color={colors.accent} strokeWidth={2.2} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted }}>SAVED</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>{totalCount}</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: HOME_SPACE.md,
                  borderRadius: COMPANY_RADIUS.lg,
                  backgroundColor: colors.cardBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  ...companyCardShadow(colors),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Sparkles size={14} color={colors.accent} strokeWidth={2.2} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted }}>REQUESTS</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>{groups.length}</Text>
              </View>
            </View>

            <View style={{ gap: HOME_SPACE.lg }}>
              {groups.map((group) => (
                <CompanyAccordionSection
                  key={group.companyRequestId}
                  title={group.requestTitle}
                  summary={savedSummary(group.students.length, group.teams.length)}
                  defaultExpanded
                >
                  <View style={{ gap: HOME_SPACE.md, paddingTop: HOME_SPACE.sm }}>
                    <Pressable
                      onPress={() =>
                        router.push(COMPANY_ROUTES.requestRecommendations(group.companyRequestId) as Href)
                      }
                      style={({ pressed }) => ({
                        alignSelf: "flex-start",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: COMPANY_RADIUS.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                        opacity: pressed ? 0.88 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>Open matches</Text>
                      <ChevronRight size={14} color={colors.foreground} strokeWidth={2.4} />
                    </Pressable>

                    {group.teams.length > 0 ? (
                      <View style={{ gap: HOME_SPACE.sm }}>
                        <Text style={{ fontSize: 11, fontWeight: "800", color: colors.muted, letterSpacing: 0.6 }}>
                          SAVED TEAMS
                        </Text>
                        {group.teams.map((item) => (
                          <CompanySavedTeamCard
                            key={item.id}
                            item={item}
                            removing={removingTeamId === item.id}
                            onRemove={() => void removeTeam(item)}
                            onNoteSave={(note) => patchTeamNote(item, note)}
                          />
                        ))}
                      </View>
                    ) : null}

                    {group.students.length > 0 ? (
                      <View style={{ gap: HOME_SPACE.sm }}>
                        <Text style={{ fontSize: 11, fontWeight: "800", color: colors.muted, letterSpacing: 0.6 }}>
                          SAVED STUDENTS
                        </Text>
                        {group.students.map((item) => (
                          <CompanySavedStudentCard
                            key={item.id}
                            item={item}
                            removing={removingStudentId === item.id}
                            onRemove={() => void removeStudent(item)}
                            onNoteSave={(note) => patchStudentNote(item, note)}
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                </CompanyAccordionSection>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </CompanyScreen>
  );
}
