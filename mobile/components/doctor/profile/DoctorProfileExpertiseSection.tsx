import { useMemo } from "react";
import { Text, View } from "react-native";

import { createDoctorProfileStyles } from "@/components/doctor/profile/doctorProfileStyles";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";

type Props = {
  technicalSkills: string[];
  researchSkills: string[];
  researchInterests: string[];
  preferredProjectAreas: string[];
};

type Group = {
  title: string;
  tags: string[];
  bg: string;
  border: string;
  color: string;
};

function TagGroup({ title, tags, bg, border, color }: Group) {
  const { colors } = useHubTheme();
  const styles = createDoctorProfileStyles(colors);

  return (
    <View style={styles.tagGroup}>
      <Text style={styles.tagGroupTitle}>{title}</Text>
      {tags.length > 0 ? (
        <View style={styles.tagWrap}>
          {tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: bg, borderColor: border }]}>
              <Text style={[styles.tagText, { color }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.tagEmpty}>Not provided</Text>
      )}
    </View>
  );
}

export function DoctorProfileExpertiseSection({
  technicalSkills,
  researchSkills,
  researchInterests,
  preferredProjectAreas,
}: Props) {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createDoctorProfileStyles(colors), [colors]);

  const groups: Group[] = [
    {
      title: "Technical expertise",
      tags: technicalSkills,
      bg: colors.primarySoft,
      border: colors.primaryBorder,
      color: colors.foreground,
    },
    {
      title: "Research skills",
      tags: researchSkills,
      bg: colors.roleBg.doctor,
      border: colors.border,
      color: colors.foreground,
    },
    {
      title: "Research interests",
      tags: researchInterests,
      bg: "rgba(168, 85, 247, 0.1)",
      border: "rgba(168, 85, 247, 0.22)",
      color: colors.foreground,
    },
    {
      title: "Preferred project areas",
      tags: preferredProjectAreas,
      bg: colors.roleBg.association,
      border: colors.border,
      color: colors.foreground,
    },
  ];

  const hasAny = groups.some((g) => g.tags.length > 0);

  return (
    <>
      <View style={styles.flatSection}>
        <Text style={styles.sectionTitle}>Expertise & Research Interests</Text>
        {!hasAny ? (
          <Text style={styles.tagEmpty}>
            No expertise tags added yet. Add technical and research skills when editing your profile.
          </Text>
        ) : (
          groups.map((group) => <TagGroup key={group.title} {...group} />)
        )}
      </View>
      <View style={styles.sheetDivider} />
    </>
  );
}
