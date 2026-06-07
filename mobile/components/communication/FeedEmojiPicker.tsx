import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";

const EMOJI_CATEGORIES: { id: string; label: string; emojis: string[] }[] = [
  {
    id: "smileys",
    label: "Smileys",
    emojis: ["😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😎", "🤔", "😅", "😭", "😤", "🙂", "😉", "😇"],
  },
  {
    id: "gestures",
    label: "Gestures",
    emojis: ["👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "✌️", "🤞", "👋", "🫶", "🤙"],
  },
  {
    id: "hearts",
    label: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💖", "💗", "💓"],
  },
  {
    id: "objects",
    label: "Objects",
    emojis: ["🎓", "📚", "💼", "📝", "📎", "💡", "🔥", "⭐", "✨", "🎯", "🏆", "📌"],
  },
  {
    id: "nature",
    label: "Nature",
    emojis: ["🌸", "🌿", "🍀", "🌞", "🌙", "☁️", "🌈", "🌊", "🐝", "🦋"],
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  colors: HubColorScheme;
};

export function FeedEmojiPicker({ visible, onClose, onSelect, colors }: Props) {
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].id);
  const [query, setQuery] = useState("");

  const styles = useMemo(() => createStyles(colors), [colors]);

  const visibleEmojis = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis ?? [];
    }
    return EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((emoji) => emoji.includes(q));
  }, [activeCategory, query]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Emoji</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search emoji"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
          </View>

          {!query.trim() ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
              {EMOJI_CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  style={[styles.tab, activeCategory === category.id && styles.tabActive]}
                  onPress={() => setActiveCategory(category.id)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeCategory === category.id && styles.tabTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <ScrollView contentContainerStyle={styles.grid}>
            {visibleEmojis.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.emojiBtn}
                onPress={() => {
                  onSelect(emoji);
                  onClose();
                }}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "flex-end",
    },
    panel: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 14,
      maxHeight: "62%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    title: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      backgroundColor: colors.inputBg,
      marginBottom: 10,
    },
    searchInput: { flex: 1, paddingVertical: 8, color: colors.foreground },
    tabs: { marginBottom: 8, maxHeight: 36 },
    tab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      marginRight: 8,
      backgroundColor: colors.inputBg,
    },
    tabActive: { backgroundColor: colors.primarySoft },
    tabText: { fontSize: 12, color: colors.muted, fontWeight: "600" },
    tabTextActive: { color: colors.primary },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      paddingBottom: 12,
    },
    emojiBtn: {
      width: "12.5%",
      minWidth: 40,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    emoji: { fontSize: 24 },
  });
