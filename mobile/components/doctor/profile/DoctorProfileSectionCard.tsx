import type { ReactNode } from "react";
import { Text, View } from "react-native";

import {
  createDoctorProfileStyles,
} from "@/components/doctor/profile/doctorProfileStyles";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function DoctorProfileSectionCard({ title, description, children }: Props) {
  const { colors } = useDoctorTheme();
  const styles = createDoctorProfileStyles(colors);

  return (
    <View style={styles.section}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDesc}>{description}</Text> : null}
        {children}
      </View>
    </View>
  );
}

type RowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

export function DoctorProfileInfoRow({ label, value, isLast }: RowProps) {
  const { colors } = useDoctorTheme();
  const styles = createDoctorProfileStyles(colors);
  const text = value.trim();

  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={text ? styles.infoValue : styles.infoEmpty} numberOfLines={3}>
        {text || "Not provided"}
      </Text>
    </View>
  );
}
