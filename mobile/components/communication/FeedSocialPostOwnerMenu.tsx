import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { confirmAlert, showAlert } from "@/lib/confirmAlert";
import { deleteStudentPost, type StudentPost } from "@/api/studentPostsApi";
import { FeedSocialPostEditSheet } from "@/components/communication/FeedSocialPostEditSheet";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";

type Props = {
  item: FeedItem;
  onUpdated: (post: StudentPost) => void;
  onDeleted: (postId: number) => void;
};

export function FeedSocialPostOwnerMenu({ item, onUpdated, onDeleted }: Props) {
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (item.relatedEntityType !== FEED_SOURCE_TYPES.studentPost) {
    return null;
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudentPost(item.relatedEntityId);
      onDeleted(item.relatedEntityId);
      setMenuOpen(false);
    } catch (err) {
      showAlert("Could not delete post", parseApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    confirmAlert({
      title: "Delete post?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => void handleDelete(),
    });
  };

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setMenuOpen(true)}
        accessibilityLabel="Post options"
        hitSlop={8}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
      </Pressable>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color={colors.foreground} />
              <Text style={styles.menuText}>Edit post</Text>
            </Pressable>
            <Pressable
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                setMenuOpen(false);
                confirmDelete();
              }}
              disabled={deleting}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
              <Text style={[styles.menuText, styles.menuTextDanger]}>Delete post</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <FeedSocialPostEditSheet
        item={item}
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={onUpdated}
      />
    </>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    trigger: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    menu: {
      width: "100%",
      maxWidth: 280,
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    menuItemDanger: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    menuText: { color: colors.foreground, fontWeight: "600", fontSize: 15 },
    menuTextDanger: { color: "#DC2626" },
  });
