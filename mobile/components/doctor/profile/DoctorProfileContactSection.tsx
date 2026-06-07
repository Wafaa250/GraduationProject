import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { createDoctorProfileStyles } from "@/components/doctor/profile/doctorProfileStyles";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

type Props = {
  email: string;
  officeHours: string;
  linkedin: string;
};

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

type TileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  tint: string;
  bg: string;
  disabled?: boolean;
  onPress?: () => void;
};

function ContactTile({ icon, label, hint, tint, bg, disabled, onPress }: TileProps) {
  const { colors } = useDoctorTheme();
  const styles = createDoctorProfileStyles(colors);

  const body = (
    <>
      <View style={[styles.contactTileIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.contactTileLabel}>{label}</Text>
      <Text style={styles.contactTileHint} numberOfLines={1}>
        {hint}
      </Text>
    </>
  );

  if (disabled || !onPress) {
    return <View style={[styles.contactTile, styles.contactTileDisabled]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.contactTile, { opacity: pressed ? 0.88 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {body}
    </Pressable>
  );
}

export function DoctorProfileContactSection({ email, officeHours, linkedin }: Props) {
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createDoctorProfileStyles(colors), [colors]);

  const emailTrim = email.trim();
  const linkedinTrim = linkedin.trim();
  const hoursTrim = officeHours.trim();

  return (
    <View style={styles.flatSection}>
      <Text style={styles.sectionTitle}>Contact Information</Text>
      <View style={styles.contactRow}>
        <ContactTile
          icon="mail-outline"
          label="Email"
          hint={emailTrim ? "Tap to send" : "Not set"}
          tint={colors.primary}
          bg={colors.primarySoft}
          disabled={!emailTrim}
          onPress={emailTrim ? () => void Linking.openURL(`mailto:${emailTrim}`) : undefined}
        />
        <ContactTile
          icon="logo-linkedin"
          label="LinkedIn"
          hint={linkedinTrim ? "View profile" : "Not set"}
          tint="#0A66C2"
          bg="rgba(10, 102, 194, 0.12)"
          disabled={!linkedinTrim}
          onPress={
            linkedinTrim ? () => void Linking.openURL(normalizeUrl(linkedinTrim)) : undefined
          }
        />
      </View>

      <View style={styles.hoursRow}>
        <View style={[styles.infoIcon, { backgroundColor: colors.roleBg.doctor }]}>
          <Ionicons name="time-outline" size={16} color={colors.doctor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoLabel}>Office hours</Text>
          <Text style={hoursTrim ? styles.infoValue : styles.infoEmpty} numberOfLines={2}>
            {hoursTrim || "Not provided"}
          </Text>
        </View>
      </View>
    </View>
  );
}
