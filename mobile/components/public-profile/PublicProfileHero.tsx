import { StyleSheet, Text, View } from "react-native";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import type { HubRoleType } from "@/constants/studentHubTheme";
import { useHubDesign } from "@/hooks/use-hub-design";

type Props = {
  name: string;
  subtitle?: string | null;
  metaLines?: string[];
  roleType: HubRoleType;
  avatarUrl?: string | null;
  avatarBase64?: string | null;
  badge?: string | null;
};

export function PublicProfileHero({
  name,
  subtitle,
  metaLines = [],
  roleType,
  avatarUrl,
  avatarBase64,
  badge,
}: Props) {
  const hub = useHubDesign();
  const { colors } = hub;
  const photo = avatarBase64?.trim() || null;

  return (
    <View style={styles.wrap}>
      <FeedAvatar
        name={name}
        size={hub.avatar.recommended + 8}
        avatarUrl={avatarUrl}
        avatarBase64={photo}
        roleType={roleType}
      />
      <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
        </View>
      ) : null}
      {metaLines.filter(Boolean).map((line) => (
        <Text key={line} style={[styles.meta, { color: colors.muted }]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
