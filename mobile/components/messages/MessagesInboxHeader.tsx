import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  totalUnread: number;
  searchVisible: boolean;
  searchQuery: string;
  onToggleSearch: () => void;
  onSearchChange: (value: string) => void;
};

export function MessagesInboxHeader({
  totalUnread,
  searchVisible,
  searchQuery,
  onToggleSearch,
  onSearchChange,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, { paddingHorizontal: layout.horizontalPadding, paddingTop: layout.space("lg") }]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { fontSize: layout.fontSize.title }]}>Messages</Text>
            {totalUnread > 0 ? (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {totalUnread > 99 ? "99+" : totalUnread}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.subtitle, { fontSize: layout.fontSize.body, marginTop: layout.space("xs") }]}>
            Your conversations
          </Text>
        </View>

        <Pressable
          onPress={onToggleSearch}
          style={[
            styles.searchBtn,
            {
              width: layout.touchTarget,
              height: layout.touchTarget,
              borderRadius: layout.radius.button,
              backgroundColor: searchVisible ? colors.primarySoft : colors.cardBg,
              borderColor: searchVisible ? colors.primaryBorder : colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={searchVisible ? "Close search" : "Search conversations"}
        >
          <Ionicons
            name={searchVisible ? "close" : "search-outline"}
            size={22}
            color={searchVisible ? colors.primary : colors.foreground}
          />
        </Pressable>
      </View>

      {searchVisible ? (
        <View
          style={[
            styles.searchField,
            {
              marginTop: layout.space("md"),
              borderRadius: layout.radius.input,
              minHeight: layout.touchTarget,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search conversations"
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { fontSize: layout.fontSize.body }]}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    wrap: {
      paddingBottom: 12,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.4,
    },
    subtitle: {
      color: colors.muted,
      lineHeight: 22,
    },
    headerBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      paddingHorizontal: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    headerBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
    },
    searchBtn: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    searchField: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.foreground,
      paddingVertical: 10,
    },
  });
