import { ChevronDown, Megaphone, MoreHorizontal } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  deleteDoctorPost,
  getDoctorPostsFeed,
  updateDoctorPost,
  type DoctorPost,
} from "@/api/doctorPostsApi";
import { createDoctorHomeStyles, HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { DoctorHomeEmptyState } from "@/components/doctor/home/DoctorHomeEmptyState";
import { DoctorHomeSection } from "@/components/doctor/home/DoctorHomeSection";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import {
  doctorPostToFeedItem,
  formatAnnouncementDateTime,
  getCurrentUserId,
} from "@/lib/doctorPostFeed";
import type { FeedItem } from "@/lib/feedTypes";

type Props = {
  refreshKey: number;
};

export function DoctorHomeAnnouncements({ refreshKey }: Props) {
  const { colors } = useHubTheme();
  const styles = createDoctorHomeStyles(colors);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<DoctorPost[]>([]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const [items, userId] = await Promise.all([getDoctorPostsFeed(40), getCurrentUserId()]);
      setPosts(items.filter((p) => p.userId === userId));
    } catch (err) {
      Alert.alert("Could not load announcements", parseApiErrorMessage(err));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts, refreshKey]);

  const feedItems = useMemo(() => posts.map((post) => doctorPostToFeedItem(post)), [posts]);
  const visible = showAll ? feedItems : feedItems.slice(0, 2);
  const hiddenCount = Math.max(0, feedItems.length - 2);

  return (
    <DoctorHomeSection
      title="My Announcements"
      subtitle="Updates shared with your students"
      icon={Megaphone}
      iconColor={colors.company}
      iconBg={colors.roleBg.company}
      count={feedItems.length}
    >
      {loading ? (
        <View style={[styles.card, styles.cardShadow, { flexDirection: "row", alignItems: "center", gap: 8, padding: HOME_SPACE.md }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ fontSize: 13, color: colors.muted }}>Loading announcements…</Text>
        </View>
      ) : feedItems.length === 0 ? (
        <DoctorHomeEmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Share course updates and supervision notes with your students."
          iconColor={colors.company}
          iconBg={colors.roleBg.company}
        />
      ) : (
        <View style={[styles.card, styles.cardShadow]}>
            {visible.map((item, index) => (
              <AnnouncementRow
                key={item.id}
                item={item}
                post={posts.find((p) => p.id === item.relatedEntityId)!}
                showDivider={index > 0}
                onUpdated={(p) => setPosts((prev) => prev.map((x) => (x.id === p.id ? p : x)))}
                onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
            {hiddenCount > 0 ? (
              <Pressable
                onPress={() => setShowAll((v) => !v)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  paddingVertical: HOME_SPACE.sm,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
                  {showAll ? "Show less" : `Show ${hiddenCount} more`}
                </Text>
                <ChevronDown
                  size={14}
                  color={colors.primary}
                  strokeWidth={2.5}
                  style={{ transform: [{ rotate: showAll ? "180deg" : "0deg" }] }}
                />
              </Pressable>
            ) : null}
        </View>
      )}
    </DoctorHomeSection>
  );
}

function AnnouncementRow({
  item,
  post,
  showDivider,
  onUpdated,
  onDeleted,
}: {
  item: FeedItem;
  post: DoctorPost;
  showDivider?: boolean;
  onUpdated: (p: DoctorPost) => void;
  onDeleted: (id: number) => void;
}) {
  const { colors } = useHubTheme();
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const published = formatAnnouncementDateTime(item.createdAt);

  const openMenu = () => {
    Alert.alert("Announcement", undefined, [
      {
        text: "Edit",
        onPress: () => {
          setEditText(post.content);
          setEditOpen(true);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Delete?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => void (async () => {
                try {
                  await deleteDoctorPost(post.id);
                  onDeleted(post.id);
                } catch (err) {
                  Alert.alert("Delete failed", parseApiErrorMessage(err));
                }
              })(),
            },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const save = async () => {
    const content = editText.trim();
    if (!content) return;
    setSaving(true);
    try {
      onUpdated(await updateDoctorPost(post.id, { content }));
      setEditOpen(false);
    } catch (err) {
      Alert.alert("Update failed", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {showDivider ? <View style={{ height: 1, backgroundColor: colors.border }} /> : null}
      <View style={{ padding: HOME_SPACE.md }}>
        <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }} numberOfLines={4}>
          {item.description?.trim() || "Untitled announcement"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ fontSize: 11, color: colors.muted }}>{published}</Text>
          <Pressable onPress={openMenu} hitSlop={8}>
            <MoreHorizontal size={16} color={colors.muted} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: colors.cardBg, borderRadius: 14, padding: HOME_SPACE.lg }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>Edit announcement</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholderTextColor={colors.muted}
              style={{
                marginTop: HOME_SPACE.md,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: HOME_SPACE.md,
                fontSize: 14,
                color: colors.foreground,
                minHeight: 90,
                textAlignVertical: "top",
              }}
            />
            <View style={{ flexDirection: "row", gap: HOME_SPACE.sm, marginTop: HOME_SPACE.md }}>
              <Pressable onPress={() => setEditOpen(false)} style={{ flex: 1, padding: 12, alignItems: "center" }}>
                <Text style={{ fontWeight: "600", color: colors.muted }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void save()}
                disabled={saving}
                style={{ flex: 1, padding: 12, alignItems: "center", backgroundColor: colors.primary, borderRadius: 10 }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ fontWeight: "600", color: "#FFF" }}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
