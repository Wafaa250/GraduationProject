import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  parseSkillsList,
  type RecruitmentPosition,
  type RecruitmentQuestion,
} from "@/api/organizationRecruitmentCampaignsApi";
import { getApplicationFormForPosition } from "@/utils/recruitmentFormFields";
import { ApplicationFormPreview } from "@/components/organization/ApplicationFormPreview";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

type Props = {
  position: RecruitmentPosition;
  questions?: RecruitmentQuestion[];
};

export function PublicRecruitmentPositionCard({ position, questions = [] }: Props) {
  const skills = parseSkillsList(position.requiredSkills);
  const formFields = getApplicationFormForPosition(questions, position.id);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{position.roleTitle}</Text>
        <View style={styles.countBadge}>
          <Ionicons name="people" size={14} color={assocColors.accentDark} />
          <Text style={styles.countTxt}>{position.neededCount} needed</Text>
        </View>
      </View>
      {position.description?.trim() ? (
        <Text style={styles.body}>{position.description.trim()}</Text>
      ) : null}
      {position.requirements?.trim() ? (
        <View style={styles.block}>
          <Text style={styles.label}>Requirements</Text>
          <Text style={styles.body}>{position.requirements.trim()}</Text>
        </View>
      ) : null}
      {skills.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.label}>Skills</Text>
          <View style={styles.chips}>
            {skills.map((skill) => (
              <View key={skill} style={styles.chip}>
                <Text style={styles.chipTxt}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.formPreview}>
        <Text style={styles.label}>Application form preview</Text>
        <Text style={styles.formHint}>
          Questions for this role (read-only until applications open).
        </Text>
        <ApplicationFormPreview fields={formFields} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: assocColors.text,
    lineHeight: 22,
  },
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
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: assocColors.subtle,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  block: { marginTop: spacing.sm },
  body: { fontSize: 14, lineHeight: 20, color: assocColors.text, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
  },
  chipTxt: { fontSize: 12, fontWeight: "700", color: assocColors.accentDark },
  formPreview: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  formHint: {
    marginBottom: spacing.sm,
    fontSize: 12,
    color: assocColors.muted,
    lineHeight: 18,
  },
});
