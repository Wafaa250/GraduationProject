import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import {
  fetchFollowStatus,
  followCompany,
  followOrganization,
  parseApiErrorMessage,
  unfollowCompany,
  unfollowOrganization,
} from "@/api/feedApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import type { HubRoleType } from "@/constants/studentHubTheme";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  extractFeedPostTags,
  feedPostActionLabel,
  feedPostRoleLabel,
  feedPostSupportsFollow,
  formatFeedPublished,
  isSocialFeedPost,
} from "@/lib/feedPostDisplay";
import type { FeedItem } from "@/lib/feedTypes";

type Props = {
  item: FeedItem;
};

function attachmentFileName(url: string): string {
  try {
    const parts = url.split("/").filter(Boolean);
    const raw = parts[parts.length - 1] ?? "Attachment";
    return decodeURIComponent(raw.split("?")[0] ?? raw);
  } catch {
    return "Attachment";
  }
}

const ROLE_ICONS: Record<HubRoleType, keyof typeof Ionicons.glyphMap> = {
  student: "person-outline",
  doctor: "school-outline",
  company: "business-outline",
  association: "people-outline",
};

export function FeedPostCard({ item }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const published = formatFeedPublished(item.createdAt);
  const tags = extractFeedPostTags(item);
  const actionLabel = feedPostActionLabel(item);
  const socialPost = isSocialFeedPost(item);
  const isFileAttachment = socialPost && item.attachmentType === "File";
  const attachmentUrl = item.attachmentUrl ?? item.imageUrl ?? null;
  const imageSrc =
    !isFileAttachment && attachmentUrl
      ? resolveApiFileUrl(attachmentUrl) ?? attachmentUrl
      : !socialPost && item.imageUrl
        ? resolveApiFileUrl(item.imageUrl) ?? item.imageUrl
        : null;
  const fileSrc =
    isFileAttachment && attachmentUrl
      ? resolveApiFileUrl(attachmentUrl) ?? attachmentUrl
      : null;
  const canFollow = feedPostSupportsFollow(item);
  const followEntityId = item.followEntityId ?? 0;
  const roleType = item.sourceType as HubRoleType;
  const roleColor = colors[roleType] ?? colors.primary;

  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const loadFollowStatus = useCallback(async () => {
    if (!canFollow || followEntityId <= 0) return;
    if (item.sourceType !== "company" && item.sourceType !== "association") return;
    const status = await fetchFollowStatus(item.sourceType, followEntityId);
    setIsFollowing(status);
  }, [canFollow, followEntityId, item.sourceType]);

  useEffect(() => {
    void loadFollowStatus();
  }, [loadFollowStatus]);

  const toggleFollow = async () => {
    if (!canFollow || followEntityId <= 0 || followBusy) return;
    setFollowBusy(true);
    try {
      if (item.sourceType === "company") {
        if (isFollowing) await unfollowCompany(followEntityId);
        else await followCompany(followEntityId);
      } else {
        if (isFollowing) await unfollowOrganization(followEntityId);
        else await followOrganization(followEntityId);
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      Alert.alert("Could not update follow", parseApiErrorMessage(err));
    } finally {
      setFollowBusy(false);
    }
  };

  const openUrl = async (url: string | null | undefined) => {
    if (!url) return;
    const resolved = resolveApiFileUrl(url) ?? url;
    try {
      await Linking.openURL(resolved);
    } catch {
      Alert.alert("Unable to open link");
    }
  };

  const handleAction = () => {
    const url = item.actionUrl?.trim();
    if (url) {
      void openUrl(url);
      return;
    }
    Alert.alert("Coming soon", "This detail view will be available in a future mobile update.");
  };

  return (
    <View
      style={[
        styles.card,
        {
          marginHorizontal: layout.horizontalPadding,
          marginBottom: layout.space("md"),
          borderRadius: layout.radius.button,
          padding: layout.space("md"),
        },
      ]}
    >
      <View style={styles.header}>
        <FeedAvatar
          name={item.sourceName}
          size={layout.scale(44)}
          avatarUrl={item.sourceAvatarUrl}
          avatarBase64={item.sourceImageBase64}
          roleType={roleType}
        />
        <View style={styles.headerMeta}>
          <Text style={[styles.author, { fontSize: layout.fontSize.label }]}>{item.sourceName}</Text>
          {!socialPost ? (
            <View style={styles.roleLine}>
              <Ionicons name={ROLE_ICONS[roleType]} size={12} color={roleColor} />
              <Text style={[styles.roleText, { color: roleColor }]}>{feedPostRoleLabel(roleType)}</Text>
            </View>
          ) : item.sourceSubtitle ? (
            <Text style={styles.subtitle}>{item.sourceSubtitle}</Text>
          ) : null}
          {published ? <Text style={styles.date}>{published}</Text> : null}
        </View>
      </View>

      <View style={styles.body}>
        {!socialPost && item.title ? (
          <Text style={[styles.title, { fontSize: layout.fontSize.body }]}>{item.title}</Text>
        ) : null}
        {item.description ? (
          <Text style={[styles.description, { fontSize: layout.fontSize.body }]}>{item.description}</Text>
        ) : null}

        {!socialPost && tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View key={`${item.id}-${tag}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {imageSrc ? (
          <Image
            source={{ uri: imageSrc }}
            style={[styles.postImage, { borderRadius: layout.radius.input }]}
            contentFit="cover"
          />
        ) : null}

        {fileSrc ? (
          <Pressable
            style={[styles.fileCard, { borderRadius: layout.radius.input }]}
            onPress={() => void openUrl(fileSrc)}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>
                {attachmentFileName(fileSrc)}
              </Text>
              <Text style={styles.fileAction}>Download file</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      {!socialPost ? (
        <View style={styles.footer}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.roleBg[roleType], borderRadius: layout.radius.input }]}
            onPress={handleAction}
          >
            <Text style={[styles.actionText, { color: roleColor }]}>{actionLabel}</Text>
          </Pressable>

          {canFollow ? (
            <Pressable
              style={[
                styles.followBtn,
                isFollowing && styles.followBtnActive,
                { borderRadius: layout.radius.input },
              ]}
              onPress={() => void toggleFollow()}
              disabled={followBusy}
            >
              {followBusy ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  {!isFollowing ? (
                    <Ionicons name="person-add-outline" size={14} color={colors.primary} />
                  ) : null}
                  <Text style={[styles.followText, isFollowing && styles.followTextActive]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    gap: 12,
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  author: {
    fontWeight: "700",
    color: colors.foreground,
  },
  roleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  date: {
    fontSize: 12,
    color: colors.muted,
  },
  body: {
    gap: 8,
  },
  title: {
    fontWeight: "700",
    color: colors.foreground,
  },
  description: {
    color: colors.foreground,
    lineHeight: 22,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  postImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    maxHeight: 280,
    backgroundColor: colors.primarySoft,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
  fileMeta: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontWeight: "600",
    color: colors.foreground,
    fontSize: 14,
  },
  fileAction: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  actionText: {
    fontWeight: "700",
    fontSize: 13,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    minHeight: 36,
  },
  followBtnActive: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
  },
  followText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  followTextActive: {
    color: colors.muted,
  },
});
