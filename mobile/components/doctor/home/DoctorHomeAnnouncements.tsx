import { ChevronDown, Megaphone, MoreHorizontal } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";
import {
  deleteDoctorPost,
  getDoctorPostsFeed,
  type DoctorPost,
} from "@/api/doctorPostsApi";
import {
  DoctorAnnouncementActionsDropdown,
  type AnnouncementActionsAnchor,
} from "@/components/doctor/home/DoctorAnnouncementActionsDropdown";
import { DoctorAnnouncementAttachment } from "@/components/doctor/home/DoctorAnnouncementAttachment";
import { DoctorAnnouncementEditSheet } from "@/components/doctor/home/DoctorAnnouncementEditSheet";
import { createDoctorHomeStyles, HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { DoctorHomeEmptyState } from "@/components/doctor/home/DoctorHomeEmptyState";
import { DoctorHomeSection } from "@/components/doctor/home/DoctorHomeSection";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import {
  doctorPostToFeedItem,
  formatAnnouncementDateTime,
  getCurrentUserId,
} from "@/lib/doctorPostFeed";
import type { FeedItem } from "@/lib/feedTypes";

type Props = {
  refreshKey: number;
  defaultExpanded?: boolean;
};

export function DoctorHomeAnnouncements({ refreshKey, defaultExpanded = false }: Props) {
  const { colors } = useDoctorTheme();
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
      collapsible
      defaultExpanded={defaultExpanded}
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
  const { colors } = useDoctorTheme();
  const menuAnchorRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<AnnouncementActionsAnchor | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const published = formatAnnouncementDateTime(item.createdAt);

  const openMenu = () => {
    requestAnimationFrame(() => {
      menuAnchorRef.current?.measureInWindow((x, y, width, height) => {
        setMenuAnchor({ x, y, width, height });
        setMenuOpen(true);
      });
    });
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuAnchor(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoctorPost(post.id);
      onDeleted(post.id);
    } catch (err) {
      showAlert("Delete failed", parseApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    confirmAlert({
      title: "Delete announcement?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => void handleDelete(),
    });
  };

  return (
    <>
      {showDivider ? <View style={{ height: 1, backgroundColor: colors.border }} /> : null}
      <View style={{ padding: HOME_SPACE.md }}>
        <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }} numberOfLines={4}>
          {post.content.trim() || item.description?.trim() || "Untitled announcement"}
        </Text>

        <DoctorAnnouncementAttachment post={post} />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ fontSize: 11, color: colors.muted }}>{published}</Text>
          <Pressable
            ref={menuAnchorRef}
            collapsable={false}
            onPress={openMenu}
            hitSlop={10}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Announcement options"
            accessibilityState={{ expanded: menuOpen }}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed || menuOpen ? 0.75 : 1,
              backgroundColor: menuOpen ? colors.primarySoft : "transparent",
            })}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <MoreHorizontal size={16} color={colors.muted} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      </View>

      <DoctorAnnouncementActionsDropdown
        visible={menuOpen}
        onClose={closeMenu}
        anchor={menuAnchor}
        deleting={deleting}
        onEdit={() => setEditOpen(true)}
        onDelete={confirmDelete}
      />

      <DoctorAnnouncementEditSheet
        visible={editOpen}
        post={post}
        onClose={() => setEditOpen(false)}
        onSaved={onUpdated}
      />
    </>
  );
}
