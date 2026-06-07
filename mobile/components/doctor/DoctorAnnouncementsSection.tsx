import { ChevronDown, MoreHorizontal, Pencil } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
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
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  doctorPostToFeedItem,
  formatAnnouncementDateTime,
  getCurrentUserId,
} from "@/lib/doctorPostFeed";
import type { FeedItem } from "@/lib/feedTypes";

type Props = {
  refreshKey: number;
};

export function DoctorAnnouncementsSection({ refreshKey }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
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
    void (async () => {
      try {
        const [items, userId] = await Promise.all([getDoctorPostsFeed(40), getCurrentUserId()]);
        setPosts(items.filter((p) => p.userId === userId));
      } catch {
        /* badge/count only — ignore */
      }
    })();
  }, [refreshKey]);

  useEffect(() => {
    if (expanded) void loadPosts();
  }, [expanded, loadPosts, refreshKey]);

  const feedItems = useMemo(() => posts.map((post) => doctorPostToFeedItem(post)), [posts]);

  const handleUpdated = (updated: DoctorPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <View style={{ marginTop: layout.space("lg") }}>
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        style={[styles.toggle, { borderRadius: 14, padding: layout.space("md") }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.toggleLeft}>
          <View style={[styles.toggleDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.toggleTitle, { fontSize: layout.scale(15) }]}>My Announcements</Text>
          {!expanded && posts.length > 0 ? (
            <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>{posts.length}</Text>
            </View>
          ) : null}
        </View>
        <ChevronDown
          size={layout.scale(18)}
          color={colors.muted}
          strokeWidth={2.5}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {expanded ? (
        <View
          style={[
            styles.panel,
            {
              borderRadius: 12,
              padding: layout.space("md"),
              marginTop: layout.space("xs"),
            },
          ]}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { fontSize: layout.scale(12) }]}>Loading…</Text>
            </View>
          ) : feedItems.length === 0 ? (
            <View>
              <Text style={[styles.emptyText, { fontSize: layout.scale(13) }]}>
                No announcements yet.
              </Text>
              <Text style={[styles.emptyHint, { fontSize: layout.scale(12), marginTop: 4 }]}>
                Share updates from the web dashboard to reach your students.
              </Text>
            </View>
          ) : (
            feedItems.map((item) => (
              <AnnouncementCard
                key={item.id}
                item={item}
                post={posts.find((p) => p.id === item.relatedEntityId)!}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

function AnnouncementCard({
  item,
  post,
  onUpdated,
  onDeleted,
}: {
  item: FeedItem;
  post: DoctorPost;
  onUpdated: (post: DoctorPost) => void;
  onDeleted: (postId: number) => void;
}) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createCardStyles(colors), [colors]);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
          Alert.alert("Delete announcement?", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => void handleDelete(),
            },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    const content = editText.trim();
    if (!content) {
      Alert.alert("Content required", "Announcement text cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateDoctorPost(post.id, { content });
      onUpdated(updated);
      setEditOpen(false);
    } catch (err) {
      Alert.alert("Could not update announcement", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoctorPost(post.id);
      onDeleted(post.id);
    } catch (err) {
      Alert.alert("Could not delete announcement", parseApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <View style={[styles.card, { borderRadius: 10, padding: layout.space("md"), marginBottom: 8 }]}>
        <Text style={[styles.content, { fontSize: layout.scale(13) }]}>
          {item.description?.trim() || "Untitled announcement"}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.date, { fontSize: layout.scale(11) }]}>{published}</Text>
          <Pressable
            onPress={openMenu}
            hitSlop={8}
            disabled={deleting}
            style={styles.menuBtn}
            accessibilityLabel="Announcement options"
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <MoreHorizontal size={layout.scale(16)} color={colors.muted} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      </View>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { borderRadius: 14, padding: layout.space("md") }]}>
            <Text style={[styles.modalTitle, { fontSize: layout.scale(16) }]}>Edit announcement</Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={[
                styles.input,
                {
                  borderRadius: 10,
                  marginTop: layout.space("md"),
                  padding: layout.space("md"),
                  fontSize: layout.scale(14),
                  minHeight: layout.scale(100),
                },
              ]}
              placeholder="Write your announcement…"
              placeholderTextColor={colors.muted}
            />
            <View style={[styles.modalActions, { marginTop: layout.space("md"), gap: 8 }]}>
              <Pressable
                onPress={() => setEditOpen(false)}
                style={[styles.modalBtn, styles.cancelBtn, { borderRadius: 10, flex: 1 }]}
              >
                <Text style={[styles.cancelText, { fontSize: layout.scale(13) }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleSave()}
                disabled={saving}
                style={[styles.modalBtn, styles.saveBtn, { borderRadius: 10, flex: 1 }]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.saveInner}>
                    <Pencil size={14} color="#FFFFFF" strokeWidth={2} />
                    <Text style={[styles.saveText, { fontSize: layout.scale(13) }]}>Save</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    toggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 2,
    },
    toggleLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    toggleDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    toggleTitle: {
      fontWeight: "800",
      color: colors.foreground,
    },
    countPill: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    countText: {
      fontSize: 11,
      fontWeight: "800",
    },
    panel: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    loadingText: {
      color: colors.muted,
    },
    emptyText: {
      color: colors.foreground,
      fontWeight: "600",
    },
    emptyHint: {
      color: colors.muted,
      lineHeight: 18,
    },
  });

const createCardStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      color: colors.foreground,
      lineHeight: 20,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
    },
    date: {
      color: colors.muted,
      flex: 1,
    },
    menuBtn: {
      padding: 4,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.45)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontWeight: "800",
      color: colors.foreground,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      color: colors.foreground,
      textAlignVertical: "top",
    },
    modalActions: {
      flexDirection: "row",
    },
    modalBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
    },
    cancelBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    cancelText: {
      color: colors.foreground,
      fontWeight: "700",
    },
    saveBtn: {
      backgroundColor: colors.primary,
    },
    saveInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    saveText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
  });
