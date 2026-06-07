import { Bookmark, Mail, Sparkles } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { CompanyMatchScoreRing } from "@/components/company/CompanyMatchScoreRing";
import { createRequestStyles } from "@/components/company/requests/requestStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import type { RecommendationCandidate } from "@/lib/companyRecommendationMappers";

type Props = {
  candidate: RecommendationCandidate;
  saved: boolean;
  saveDisabled?: boolean;
  onViewProfile: () => void;
  onToggleSave: () => void;
};

export function CompanyRecommendationCard({
  candidate,
  saved,
  saveDisabled = false,
  onViewProfile,
  onToggleSave,
}: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createRequestStyles(colors), [colors]);
  const education = [candidate.major, candidate.university, candidate.year].filter(Boolean).join(" · ");

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <FeedAvatar name={candidate.name} size={48} roleType="student" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }} numberOfLines={1}>
            {candidate.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3 }} numberOfLines={2}>
            {education}
          </Text>
        </View>
        <CompanyMatchScoreRing score={candidate.matchScore} size={52} />
      </View>

      {candidate.matchingSkills.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <Text style={styles.sectionLabel}>Matching skills</Text>
          <View style={styles.chipWrap}>
            {candidate.matchingSkills.map((skill) => (
              <View key={skill} style={styles.chip}>
                <Text style={styles.chipText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {candidate.insights.length > 0 ? (
        <View style={styles.insightBox}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Sparkles size={14} color={colors.accent} strokeWidth={2.2} />
            <Text style={styles.insightTitle}>Why this match</Text>
          </View>
          {candidate.insights.map((line) => (
            <Text key={line} style={styles.insightLine}>
              • {line}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Pressable
          onPress={onViewProfile}
          style={({ pressed }) => [styles.primaryBtn, { flex: 1 }, pressed && { opacity: 0.92 }]}
        >
          <Mail size={16} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.primaryBtnText}>Profile & Contact</Text>
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          disabled={saveDisabled}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { width: 52, paddingHorizontal: 0 },
            saved && { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
            saveDisabled && { opacity: 0.45 },
            pressed && !saveDisabled && { opacity: 0.92 },
          ]}
          accessibilityLabel={saved ? "Remove from saved" : "Save candidate"}
        >
          <Bookmark
            size={20}
            color={saved ? colors.accent : colors.foreground}
            fill={saved ? colors.accent : "transparent"}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>
    </View>
  );
}
