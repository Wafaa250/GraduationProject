import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import {
  fetchFollowStatus,
  followCompany,
  followOrganization,
  parseApiErrorMessage,
  unfollowCompany,
  unfollowOrganization,
} from "@/api/feedApi";
import type { StudentPost } from "@/api/studentPostsApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { FeedSocialPostOwnerMenu } from "@/components/communication/FeedSocialPostOwnerMenu";
import { HubButton } from "@/components/hub/HubButton";
import { HubCard } from "@/components/hub/HubCard";
import type { HubRoleType } from "@/constants/studentHubTheme";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubDesign } from "@/hooks/use-hub-design";
import { convertWebPathToMobile, resolveFeedPostActionUrl } from "@/lib/feedActionRoutes";
import {
  extractFeedPostTags,
  feedPostActionLabel,
  feedPostRoleLabel,
  feedPostSupportsFollow,
  formatFeedPublished,
  isSocialFeedPost,
  resolveFeedPostRoleType,
} from "@/lib/feedPostDisplay";
import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";
import { getHubRoleAccent } from "@/lib/hubRoleAccent";
import {
  getCurrentUserId,
  isOwnStudentPost,
  socialPostAuthorProfileUrl,
} from "@/lib/studentPostFeed";

type Props = {
  item: FeedItem;
  onSocialPostUpdated?: (post: StudentPost) => void;
  onSocialPostDeleted?: (postId: number) => void;
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

export function FeedPostCard({ item, onSocialPostUpdated, onSocialPostDeleted }: Props) {
  const hub = useHubDesign();
  const { colors } = hub;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const published = formatFeedPublished(item.createdAt);
  const tags = extractFeedPostTags(item);
  const actionLabel = feedPostActionLabel(item);
  const actionUrl = resolveFeedPostActionUrl(item);
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
  const roleType = resolveFeedPostRoleType(item) as HubRoleType;
  const roleAccent = getHubRoleAccent(colors, roleType);
  const roleColor = roleAccent.fg;
  const authorProfileUrl = socialPost ? socialPostAuthorProfileUrl(item) : actionUrl;

  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(0);

  useEffect(() => {
    void getCurrentUserId().then(setCurrentUserId);
  }, []);

  const ownsPost =
    socialPost &&
    item.relatedEntityType === FEED_SOURCE_TYPES.studentPost &&
    isOwnStudentPost(item, currentUserId);
  const showOwnerMenu = ownsPost && onSocialPostUpdated && onSocialPostDeleted;

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

  const openExternalUrl = async (url: string) => {
    const resolved = resolveApiFileUrl(url) ?? url;
    try {
      await Linking.openURL(resolved);
    } catch {
      Alert.alert("Unable to open link");
    }
  };

  const navigateToPath = (path: string) => {
    const mobilePath = convertWebPathToMobile(path) ?? path;
    if (mobilePath.startsWith("http://") || mobilePath.startsWith("https://")) {
      void openExternalUrl(mobilePath);
      return;
    }
    router.push(mobilePath as never);
  };

  const handleAction = () => navigateToPath(actionUrl);
  const handleAuthorPress = () => navigateToPath(authorProfileUrl);

  return (
    <HubCard accentColor={roleColor}>
      <View style={styles.header}>
        {socialPost ? (
          <Pressable onPress={handleAuthorPress} accessibilityRole="button">
            <FeedAvatar
              name={item.sourceName}
              size={hub.avatar.feed}
              avatarUrl={item.sourceAvatarUrl}
              avatarBase64={item.sourceImageBase64}
              roleType={roleType}
            />
          </Pressable>
        ) : (
          <FeedAvatar
            name={item.sourceName}
            size={hub.avatar.feed}
            avatarUrl={item.sourceAvatarUrl}
            avatarBase64={item.sourceImageBase64}
            roleType={roleType}
          />
        )}

        <View style={styles.headerMeta}>
          {!socialPost ? (
            <Text style={[styles.author, hub.type.author]}>{item.sourceName}</Text>
          ) : (
            <Pressable onPress={handleAuthorPress}>
              <Text style={[styles.author, hub.type.author]}>{item.sourceName}</Text>
            </Pressable>
          )}
          <View style={styles.roleLine}>
            <Ionicons name={ROLE_ICONS[roleType]} size={12} color={roleColor} />
            <Text style={[styles.roleText, { color: roleColor }]}>{feedPostRoleLabel(roleType)}</Text>
          </View>
          {item.sourceSubtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.sourceSubtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.headerRight}>
          {published ? <Text style={styles.date}>{published}</Text> : null}
          {showOwnerMenu ? (
            <FeedSocialPostOwnerMenu
              item={item}
              onUpdated={(post) => onSocialPostUpdated?.(post)}
              onDeleted={onSocialPostDeleted}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        {!socialPost && item.title ? (
          <Text style={[styles.title, hub.type.author]}>{item.title}</Text>
        ) : null}
        {item.description ? (
          <Text style={[styles.description, hub.type.body]}>{item.description}</Text>
        ) : null}

        {!socialPost && tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View key={`${item.id}-${tag}`} style={[styles.tag, { backgroundColor: roleAccent.bg }]}>
                <Text style={[styles.tagText, { color: roleColor }]}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {imageSrc ? (
          <Image
            source={{ uri: imageSrc }}
            style={[
              styles.postImage,
              {
                borderRadius: hub.radius.md,
                borderColor: roleAccent.border,
                backgroundColor: roleAccent.bg,
              },
            ]}
            contentFit="cover"
          />
        ) : null}

        {fileSrc ? (
          <Pressable
            style={[
              styles.fileCard,
              {
                borderRadius: hub.radius.md,
                borderColor: roleAccent.border,
                backgroundColor: roleAccent.bg,
              },
            ]}
            onPress={() => void openExternalUrl(fileSrc)}
          >
            <View style={[styles.fileIconWrap, { backgroundColor: colors.cardBg }]}>
              <Ionicons name="document-text-outline" size={20} color={roleColor} />
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>
                {attachmentFileName(fileSrc)}
              </Text>
              <Text style={styles.fileAction}>Tap to open</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {socialPost ? (
        <View style={styles.footer}>
          <HubButton
            label="View profile"
            variant="secondary"
            size="sm"
            accent={roleType}
            icon="person-outline"
            onPress={handleAuthorPress}
          />
        </View>
      ) : (
        <View style={styles.footer}>
          <HubButton
            label={actionLabel}
            variant="primary"
            accent={roleType}
            onPress={handleAction}
          />
          {canFollow ? (
            <HubButton
              label={isFollowing ? "Following" : "Follow"}
              variant="secondary"
              icon={isFollowing ? undefined : "person-add-outline"}
              loading={followBusy}
              active={isFollowing}
              accent={roleType}
              onPress={() => void toggleFollow()}
            />
          ) : null}
        </View>
      )}
    </HubCard>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    headerMeta: {
      flex: 1,
      gap: 2,
      paddingTop: 2,
    },
    headerRight: {
      alignItems: "flex-end",
      gap: 4,
      minWidth: 48,
    },
    author: { color: colors.foreground },
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
      fontSize: 11,
      color: colors.muted,
      fontWeight: "500",
    },
    body: {
      gap: 10,
      marginTop: 2,
    },
    title: {
      color: colors.foreground,
    },
    description: {
      color: colors.foreground,
    },
    tags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    tagText: {
      fontSize: 11,
      fontWeight: "600",
    },
    postImage: {
      width: "100%",
      aspectRatio: 16 / 9,
      maxHeight: 260,
      borderWidth: 1,
    },
    fileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderWidth: 1,
    },
    fileIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
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
      fontSize: 11,
      color: colors.muted,
    },
    footer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 4,
    },
  });
