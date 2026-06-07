import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import {
  Bookmark,
  ExternalLink,
  Globe,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  getCompanyStudentDiscoveryProfile,
  getSavedRecommendationIds,
  parseApiErrorMessage,
  saveStudentRecommendation,
  unsaveStudentRecommendation,
  type CompanyStudentDiscoveryProfile,
} from "@/api/companyApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { CompanyMatchScoreRing } from "@/components/company/CompanyMatchScoreRing";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { createRequestStyles } from "@/components/company/requests/requestStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { CompanyAccordionSection } from "@/components/company/ui/CompanyAccordionSection";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanySegmentTabs } from "@/components/company/ui/CompanySegmentTabs";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { COMPANY_STUDENT_CONTACT_INTRO } from "@/lib/companyWorkspaceCopy";

type ProfileTab = "about" | "skills" | "projects" | "contact";

const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: "about", label: "About" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "contact", label: "Contact" },
];

export default function CompanyStudentDiscoveryScreen() {
  const { requestId: reqParam, studentProfileId: studentParam, teamId: teamParam } =
    useLocalSearchParams<{
      requestId: string;
      studentProfileId: string;
      teamId?: string;
    }>();
  const requestId = Number(reqParam);
  const studentProfileId = Number(studentParam);
  const teamId = teamParam ? Number(teamParam) : undefined;
  const colors = useCompanyTheme();
  const styles = useMemo(() => createRequestStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("about");

  const [profile, setProfile] = useState<CompanyStudentDiscoveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(requestId) || !Number.isFinite(studentProfileId)) {
      setError("Invalid profile link.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCompanyStudentDiscoveryProfile(requestId, studentProfileId, teamId);
      setProfile(data);
      setError(null);
      const ids = await getSavedRecommendationIds(requestId);
      setSaved(ids.studentProfileIds.includes(studentProfileId));
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [requestId, studentProfileId, teamId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const student = profile?.student;
  const rec = profile?.recommendation;
  const matchScore = rec?.matchScore;

  const toggleSave = async () => {
    setSaving(true);
    try {
      if (saved) {
        await unsaveStudentRecommendation(requestId, studentProfileId);
        setSaved(false);
      } else {
        await saveStudentRecommendation(requestId, studentProfileId);
        setSaved(true);
      }
    } catch (err) {
      Alert.alert("Could not update saved state", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openUrl = async (url: string) => {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    try {
      await Linking.openURL(normalized);
    } catch {
      Alert.alert("Cannot open link");
    }
  };

  const subtitle = student
    ? [rec?.alignedRoleName, student.major].filter(Boolean).join(" · ") || student.major
    : undefined;

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader
        title={student?.name ?? "Candidate"}
        subtitle={profile?.request.title}
        fallbackHref={
          teamId
            ? COMPANY_ROUTES.teamDiscoveryProfile(requestId, teamId)
            : COMPANY_ROUTES.requestRecommendations(requestId)
        }
        showAccountMenu={false}
      />

      {loading && !profile ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={{ padding: HOME_SPACE.lg }}>
          <CompanyEmptyState icon={UserRound} message={error} actionLabel="Retry" onAction={() => void load()} />
        </View>
      ) : student && profile ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
          }
          contentContainerStyle={[styles.screenPad, { gap: HOME_SPACE.md }]}
        >
          <View style={styles.card}>
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <FeedAvatar
                name={student.name}
                size={72}
                avatarBase64={student.profilePictureBase64}
                roleType="student"
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.heroTitle}>{student.name}</Text>
                {subtitle ? (
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{subtitle}</Text>
                ) : null}
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }} numberOfLines={2}>
                  {[student.university, student.academicYear].filter(Boolean).join(" · ")}
                </Text>
              </View>
              {matchScore != null ? <CompanyMatchScoreRing score={matchScore} size={56} /> : null}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <ActionChip
                icon={Bookmark}
                label={saved ? "Saved" : "Save Candidate"}
                active={saved}
                onPress={() => void toggleSave()}
                disabled={saving}
                colors={colors}
              />
              <ActionChip
                icon={Mail}
                label="View Contact"
                onPress={() => setActiveTab("contact")}
                colors={colors}
              />
            </View>
          </View>

          <CompanySegmentTabs tabs={PROFILE_TABS} active={activeTab} onChange={setActiveTab} />

          {activeTab === "about" ? (
            <View style={{ gap: HOME_SPACE.md }}>
              <View style={styles.card}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
                  About
                </Text>
                <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textSecondary }}>
                  {student.bio?.trim() || "No bio provided yet."}
                </Text>
              </View>

              <CompanyAccordionSection
                title="Education"
                summary={[student.university, student.major].filter(Boolean).join(" · ") || "Education details"}
              >
                <View style={{ paddingTop: HOME_SPACE.sm }}>
                  <InfoLine label="University" value={student.university} colors={colors} />
                  <InfoLine label="Faculty" value={student.faculty} colors={colors} />
                  <InfoLine label="Major" value={student.major} colors={colors} />
                  <InfoLine label="Academic Year" value={student.academicYear} colors={colors} isLast />
                </View>
              </CompanyAccordionSection>

              {rec ? (
                <>
                  <CompanyAccordionSection
                    title="AI Match Explanation"
                    icon={Sparkles}
                    defaultExpanded
                    summary={rec.reasonSummary}
                  >
                    <View style={[styles.insightBox, { marginTop: HOME_SPACE.sm }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Sparkles size={14} color={colors.accent} strokeWidth={2.2} />
                        <Text style={styles.insightTitle}>Match summary</Text>
                      </View>
                      <Text style={[styles.insightLine, { marginTop: 6 }]}>{rec.reasonSummary}</Text>
                      {rec.highlights.map((line) => (
                        <Text key={line} style={styles.insightLine}>
                          • {line}
                        </Text>
                      ))}
                      {rec.alignedRoleName ? (
                        <Text style={{ marginTop: 10, fontSize: 14, fontWeight: "700", color: colors.accent }}>
                          Suggested role: {rec.alignedRoleName}
                        </Text>
                      ) : null}
                    </View>
                  </CompanyAccordionSection>

                  <CompanyAccordionSection
                    title="Recommendation Context"
                    summary={profile.request.title}
                  >
                    <View style={{ paddingTop: HOME_SPACE.sm }}>
                      <InfoLine label="Project Request" value={profile.request.title} colors={colors} />
                      {matchScore != null ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
                          <Text style={{ fontSize: 13, color: colors.muted }}>Match score</Text>
                          <CompanyMatchScoreRing score={matchScore} size={44} />
                        </View>
                      ) : null}
                      {profile.request.roleNames.length > 0 ? (
                        <SkillGroup label="Requested Roles" items={profile.request.roleNames} styles={styles} />
                      ) : null}
                      {rec.relevantSkills.length > 0 ? (
                        <SkillGroup label="Relevant Skills" items={rec.relevantSkills} styles={styles} />
                      ) : null}
                    </View>
                  </CompanyAccordionSection>
                </>
              ) : null}
            </View>
          ) : null}

          {activeTab === "skills" ? (
            <View style={styles.card}>
              <SkillGroup label="Roles" items={student.roles} styles={styles} />
              <SkillGroup label="Technical Skills" items={student.technicalSkills} styles={styles} />
              <SkillGroup label="Tools" items={student.tools} styles={styles} />
              {student.roles.length === 0 &&
              student.technicalSkills.length === 0 &&
              student.tools.length === 0 ? (
                <Text style={{ fontSize: 14, color: colors.muted }}>No skills listed yet.</Text>
              ) : null}
            </View>
          ) : null}

          {activeTab === "projects" ? (
            <View style={styles.card}>
              {profile.projects.length === 0 ? (
                <Text style={{ fontSize: 14, color: colors.muted }}>No projects listed yet.</Text>
              ) : (
                profile.projects.map((project) => (
                  <View key={project.id} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{project.title}</Text>
                    {project.description ? (
                      <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 4 }}>
                        {project.description}
                      </Text>
                    ) : null}
                    {project.technologies.length > 0 ? (
                      <View style={[styles.chipWrap, { marginTop: 8 }]}>
                        {project.technologies.map((t) => (
                          <View key={t} style={styles.skillChip}>
                            <Text style={styles.skillChipText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          ) : null}

          {activeTab === "contact" ? (
            <View style={styles.card}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>Contact Information</Text>
              <Text style={{ fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 6 }}>
                {COMPANY_STUDENT_CONTACT_INTRO}
              </Text>
              <ContactRow
                icon={Mail}
                label="Email"
                value={student.email}
                onOpen={student.email ? () => void openUrl(`mailto:${student.email}`) : undefined}
                colors={colors}
                styles={styles}
              />
              <ContactRow
                icon={Globe}
                label="LinkedIn"
                value={student.linkedin}
                onOpen={student.linkedin ? () => void openUrl(student.linkedin!) : undefined}
                colors={colors}
                styles={styles}
              />
              <ContactRow
                icon={Globe}
                label="GitHub"
                value={student.github}
                onOpen={student.github ? () => void openUrl(student.github!) : undefined}
                colors={colors}
                styles={styles}
              />
              <ContactRow
                icon={Globe}
                label="Portfolio"
                value={student.portfolio}
                onOpen={student.portfolio ? () => void openUrl(student.portfolio!) : undefined}
                colors={colors}
                styles={styles}
                isLast
              />
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </CompanyScreen>
  );
}

function InfoLine({
  label,
  value,
  colors,
  isLast,
}: {
  label: string;
  value?: string | null;
  colors: ReturnType<typeof useCompanyTheme>;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        paddingVertical: 8,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.4 }}>{label}</Text>
      <Text style={{ fontSize: 15, color: colors.foreground, marginTop: 2 }}>{value?.trim() || "—"}</Text>
    </View>
  );
}

function SkillGroup({
  label,
  items,
  styles,
}: {
  label: string;
  items: string[];
  styles: ReturnType<typeof createRequestStyles>;
}) {
  if (items.length === 0) return null;
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {items.map((item) => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ActionChip({
  icon: Icon,
  label,
  onPress,
  active,
  disabled,
  colors,
}: {
  icon: typeof Bookmark;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  colors: ReturnType<typeof useCompanyTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: COMPANY_RADIUS.pill,
        borderWidth: 1,
        borderColor: active ? colors.accentBorder : colors.border,
        backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
        opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
      })}
    >
      <Icon size={14} color={active ? colors.accent : colors.foreground} strokeWidth={2.2} />
      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? colors.accent : colors.foreground }}>{label}</Text>
    </Pressable>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  onOpen,
  colors,
  styles,
  isLast,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
  onOpen?: () => void;
  colors: ReturnType<typeof useCompanyTheme>;
  styles: ReturnType<typeof createRequestStyles>;
  isLast?: boolean;
}) {
  const display = value?.trim() || `No ${label.toLowerCase()} specified`;
  return (
    <View
      style={[
        styles.specRow,
        isLast && { borderBottomWidth: 0 },
        { marginTop: 12 },
      ]}
    >
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Icon size={16} color={colors.accent} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionLabel}>{label}</Text>
          <Text style={{ fontSize: 14, color: colors.foreground, marginTop: 2 }} numberOfLines={1}>
            {display}
          </Text>
        </View>
      </View>
      {onOpen ? (
        <Pressable onPress={onOpen} style={styles.secondaryBtn} hitSlop={8}>
          <ExternalLink size={14} color={colors.accent} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}
