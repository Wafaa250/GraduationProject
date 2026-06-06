import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { createDoctorProfileStyles } from "@/components/doctor/profile/doctorProfileStyles";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";

type Props = {
  faculty: string;
  department: string;
  academicRank: string;
  specialization: string;
  university: string;
  yearsOfExperience: number | null;
};

type Row = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: Row) {
  const { colors } = useHubTheme();
  const styles = createDoctorProfileStyles(colors);
  const text = value.trim();

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={text ? styles.infoValue : styles.infoEmpty} numberOfLines={2}>
          {text || "Not provided"}
        </Text>
      </View>
    </View>
  );
}

export function DoctorProfileAcademicSection({
  faculty,
  department,
  academicRank,
  specialization,
  university,
  yearsOfExperience,
}: Props) {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createDoctorProfileStyles(colors), [colors]);

  const rows: Row[] = [
    { icon: "business-outline", label: "Faculty", value: faculty },
    { icon: "git-branch-outline", label: "Department", value: department },
    { icon: "ribbon-outline", label: "Academic rank", value: academicRank },
    { icon: "book-outline", label: "Specialization", value: specialization },
    { icon: "school-outline", label: "University", value: university },
    {
      icon: "time-outline",
      label: "Years of experience",
      value: yearsOfExperience != null ? String(yearsOfExperience) : "",
    },
  ];

  return (
    <>
      <View style={styles.flatSection}>
        <Text style={styles.sectionTitle}>Academic Information</Text>
        <View style={styles.infoList}>
          {rows.map((row) => (
            <InfoRow key={row.label} {...row} />
          ))}
        </View>
      </View>
      <View style={styles.sheetDivider} />
    </>
  );
}
