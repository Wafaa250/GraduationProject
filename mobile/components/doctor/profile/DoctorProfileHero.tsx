import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { createDoctorProfileStyles } from "@/components/doctor/profile/doctorProfileStyles";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { DoctorProfileViewData } from "@/lib/doctorProfileTypes";
import { uniqueDoctorProfileLabels } from "@/lib/doctorProfileText";

type Props = {
  data: DoctorProfileViewData;
  onEditPress: () => void;
};

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export function DoctorProfileCover() {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createDoctorProfileStyles(colors), [colors]);

  return (
    <LinearGradient
      colors={[colors.gradient[0], colors.gradient[1], colors.primarySoft]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cover}
    />
  );
}

type AvatarProps = {
  name: string;
  photoUrl: string | null;
};

export function DoctorProfileAvatar({ name, photoUrl }: AvatarProps) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createDoctorProfileStyles(colors), [colors]);
  const avatarSize = layout.scale(112);
  const avatarBorder = 4;
  const ringSize = avatarSize + avatarBorder * 2;

  return (
    <View style={styles.avatarSlot}>
      <View
        style={[
          styles.avatarRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: colors.cardBg,
          },
        ]}
      >
        <FeedAvatar
          name={name || "Doctor"}
          size={avatarSize}
          avatarBase64={photoUrl}
          roleType="doctor"
        />
      </View>
    </View>
  );
}

export function DoctorProfileHero({ data, onEditPress }: Props) {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createDoctorProfileStyles(colors), [colors]);

  const headline = uniqueDoctorProfileLabels([data.academicRank, data.specialization]).join(" · ");
  const chips = uniqueDoctorProfileLabels([data.faculty, data.department, data.specialization]);
  const linkedinTrim = data.linkedin.trim();
  const emailTrim = data.email.trim();

  const stats = [
    { value: data.supervisedStudents, label: "Supervised students" },
    { value: data.activeProjects, label: "Active projects" },
    { value: data.completedProjects, label: "Completed projects" },
  ];

  return (
    <>
      <View style={styles.sheetInner}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>DOCTOR · SUPERVISOR</Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {data.name || "—"}
        </Text>

        {headline ? (
          <Text style={styles.headline} numberOfLines={2}>
            {headline}
          </Text>
        ) : null}

        {data.university.trim() ? (
          <Text style={styles.subline} numberOfLines={2}>
            {data.university.trim()}
          </Text>
        ) : null}

        {emailTrim ? (
          <Text style={styles.subline} numberOfLines={1}>
            {emailTrim}
          </Text>
        ) : null}

        {data.yearsOfExperience != null && data.yearsOfExperience > 0 ? (
          <Text style={[styles.subline, { marginTop: 6, color: colors.primary, fontWeight: "700" }]}>
            {data.yearsOfExperience} years experience
          </Text>
        ) : null}

        {chips.length > 0 ? (
          <View style={styles.chipRow}>
            {chips.map((chip) => (
              <View key={chip} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {chip}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.statsBar}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={{ flex: 1, flexDirection: "row" }}>
              {index > 0 ? <View style={styles.statDivider} /> : null}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={onEditPress}
            style={({ pressed }) => [styles.editBtnWrap, { opacity: pressed ? 0.92 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <LinearGradient
              colors={[colors.gradient[0], colors.gradient[1]]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.editBtnGradient}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </LinearGradient>
          </Pressable>

          {data.email.trim() ? (
            <Pressable
              onPress={() => void Linking.openURL(`mailto:${emailTrim}`)}
              style={({ pressed }) => [styles.contactQuickBtn, { opacity: pressed ? 0.88 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Send email"
            >
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
            </Pressable>
          ) : null}

          {linkedinTrim ? (
            <Pressable
              onPress={() => void Linking.openURL(normalizeUrl(linkedinTrim))}
              style={({ pressed }) => [styles.contactQuickBtn, { opacity: pressed ? 0.88 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Open LinkedIn"
            >
              <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.sheetDivider} />
    </>
  );
}
