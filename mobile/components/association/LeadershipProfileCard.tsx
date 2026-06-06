import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { UserRound } from "lucide-react-native";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export type LeadershipProfileCardProps = {
  fullName: string;
  roleTitle: string;
  major?: string | null;
  imageUrl?: string | null;
  linkedInUrl?: string | null;
  organizationName: string;
  preview?: boolean;
  compact?: boolean;
  deleting?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

function resolveImageSrc(imageUrl: string | null | undefined): string | null {
  if (!imageUrl?.trim()) return null;
  if (imageUrl.startsWith("file:") || imageUrl.startsWith("http")) return imageUrl;
  return resolveApiFileUrl(imageUrl) ?? imageUrl;
}

export function LeadershipProfileCard({
  fullName,
  roleTitle,
  major,
  imageUrl,
  linkedInUrl,
  organizationName,
  preview = false,
  compact = false,
  deleting = false,
  onEdit,
  onDelete,
}: LeadershipProfileCardProps) {
  const layout = useResponsiveLayout();
  const src = resolveImageSrc(imageUrl ?? null);
  const name = fullName.trim();
  const role = roleTitle.trim();
  const majorText = major?.trim();
  const linkedIn = linkedInUrl?.trim();
  const initial = (name || "?").charAt(0).toUpperCase();
  const isDraft = preview && (!name || !role);

  const displayName = name || (preview ? "Full name" : "");
  const displayRole = role || (preview ? "Position" : "");
  const displayMajor = majorText || (preview ? "Major (optional)" : "");

  const coverH = compact ? (src ? 72 : 56) : src ? 120 : 96;
  const avatarSize = compact ? 80 : 104;
  const avatarOffset = compact ? (src ? -44 : -36) : src ? -64 : -52;

  return (
    <View
      style={[
        associationCardStyles.card,
        styles.card,
        {
          borderRadius: compact ? layout.radius.input : layout.radius.button + 4,
          opacity: isDraft ? 0.96 : 1,
        },
      ]}
    >
      <View style={[styles.cover, { height: coverH }]}>
        {src ? <Image source={{ uri: src }} style={styles.coverImage} resizeMode="cover" /> : null}
        <View style={styles.coverFade} />
      </View>

      <View style={[styles.avatarRing, { marginTop: avatarOffset }]}>
        {src ? (
          <Image source={{ uri: src }} style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
        ) : (
          <View style={[styles.avatarPlaceholder, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
            {name ? (
              <Text style={[styles.avatarInitial, compact && { fontSize: 28 }]}>{initial}</Text>
            ) : (
              <UserRound size={compact ? 24 : preview ? 32 : 28} color={ASSOC_COLORS.accentDark} strokeWidth={1.5} />
            )}
          </View>
        )}
      </View>

      <View style={[styles.body, compact && styles.bodyCompact]}>
        <Text style={[styles.name, !name && preview ? styles.placeholder : null]}>{displayName}</Text>
        <Text style={[styles.role, !role && preview ? styles.rolePlaceholder : null]}>{displayRole}</Text>
        {(majorText || preview) ? (
          <Text style={[styles.major, !majorText && preview ? styles.placeholder : null]}>{displayMajor}</Text>
        ) : null}
        <Text style={styles.org}>{organizationName}</Text>
        {linkedIn ? (
          <View style={styles.social}>
            <Ionicons name="logo-linkedin" size={15} color="#0A66C2" />
            <Text style={styles.socialText}>LinkedIn</Text>
          </View>
        ) : null}
      </View>

      {!preview && onEdit && onDelete ? (
        <View style={styles.admin}>
          <Pressable onPress={onEdit} style={styles.adminBtn}>
            <Ionicons name="pencil-outline" size={14} color={ASSOC_COLORS.muted} />
            <Text style={styles.adminBtnText}>Edit</Text>
          </Pressable>
          <View style={styles.adminDot} />
          <Pressable onPress={onDelete} disabled={deleting} style={styles.adminBtn}>
            <Ionicons name="trash-outline" size={14} color="#DC2626" />
            <Text style={[styles.adminBtnText, styles.adminBtnDanger]}>
              {deleting ? "Removing…" : "Remove"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    padding: 0,
  },
  cover: {
    backgroundColor: ASSOC_COLORS.accent,
    position: "relative",
    overflow: "hidden",
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  coverFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarRing: {
    alignItems: "center",
    zIndex: 1,
  },
  avatar: {
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: "800",
    color: ASSOC_COLORS.accentDark,
  },
  body: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  bodyCompact: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    textAlign: "center",
  },
  placeholder: {
    color: ASSOC_COLORS.muted,
    fontStyle: "italic",
    fontWeight: "600",
  },
  role: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    color: ASSOC_COLORS.accentDark,
    backgroundColor: ASSOC_COLORS.accentSoft,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
    overflow: "hidden",
  },
  rolePlaceholder: {
    color: ASSOC_COLORS.muted,
    backgroundColor: ASSOC_COLORS.background,
    borderColor: ASSOC_COLORS.border,
    fontStyle: "italic",
    fontWeight: "600",
  },
  major: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
    color: ASSOC_COLORS.muted,
    textAlign: "center",
  },
  org: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: ASSOC_COLORS.muted,
  },
  social: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  socialText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0A66C2",
  },
  admin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.background,
  },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  adminBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: ASSOC_COLORS.muted,
  },
  adminBtnDanger: {
    color: "#DC2626",
  },
  adminDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: ASSOC_COLORS.border,
  },
});
