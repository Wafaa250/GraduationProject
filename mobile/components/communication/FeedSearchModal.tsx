import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { parseApiErrorMessage, searchCommunicationHub, type HubSearchResultRow } from "@/api/feedApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { HUB_COLORS, type HubRoleType } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { feedPostRoleLabel } from "@/lib/feedPostDisplay";

type Props = {
  visible: boolean;
  initialQuery: string;
  onClose: () => void;
  onQueryChange: (query: string) => void;
};

type SearchRow = HubSearchResultRow & { key: string };

function roleFromEntityType(entityType: string): HubRoleType {
  const t = entityType.toLowerCase();
  if (t === "doctor") return "doctor";
  if (t === "company") return "company";
  if (t === "association") return "association";
  return "student";
}

export function FeedSearchModal({ visible, initialQuery, onClose, onQueryChange }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchRow[]>([]);

  useEffect(() => {
    if (visible) setQuery(initialQuery);
  }, [visible, initialQuery]);

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await searchCommunicationHub(trimmed);
      const rows: SearchRow[] = [
        ...data.students.map((r) => ({ ...r, key: `student-${r.entityId}` })),
        ...data.doctors.map((r) => ({ ...r, key: `doctor-${r.entityId}` })),
        ...data.companies.map((r) => ({ ...r, key: `company-${r.entityId}` })),
        ...data.associations.map((r) => ({ ...r, key: `association-${r.entityId}` })),
      ];
      setResults(rows);
    } catch (err) {
      setError(parseApiErrorMessage(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => void runSearch(query), 350);
    return () => clearTimeout(timer);
  }, [query, visible, runSearch]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onQueryChange(value);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View
          style={[
            styles.header,
            { paddingHorizontal: layout.horizontalPadding, gap: layout.space("sm") },
          ]}
        >
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close search">
            <Ionicons name="arrow-back" size={layout.iconSize + 4} color={HUB_COLORS.foreground} />
          </Pressable>
          <View style={[styles.searchWrap, { borderRadius: layout.radius.input, flex: 1 }]}>
            <Ionicons name="search" size={layout.iconSize} color={HUB_COLORS.muted} />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search..."
              placeholderTextColor={HUB_COLORS.muted}
              style={[styles.searchInput, { fontSize: layout.fontSize.body }]}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => handleQueryChange("")} hitSlop={8}>
                <Ionicons name="close-circle" size={layout.iconSize} color={HUB_COLORS.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={HUB_COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : results.length === 0 && query.trim() ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No results found.</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{
              paddingHorizontal: layout.horizontalPadding,
              paddingBottom: insets.bottom + layout.space("xl"),
            }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const role = roleFromEntityType(item.entityType);
              return (
                <View style={styles.resultRow}>
                  <FeedAvatar
                    name={item.name}
                    size={layout.scale(44)}
                    avatarUrl={item.avatarUrl}
                    avatarBase64={item.avatarBase64}
                    roleType={role}
                  />
                  <View style={styles.resultMeta}>
                    <Text style={[styles.resultName, { fontSize: layout.fontSize.label }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.resultSubtitle, { fontSize: layout.fontSize.footer }]}>
                      {item.subtitle || feedPostRoleLabel(role)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HUB_COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: HUB_COLORS.inputBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: HUB_COLORS.foreground,
    padding: 0,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: "#DC2626",
    textAlign: "center",
  },
  emptyText: {
    color: HUB_COLORS.muted,
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HUB_COLORS.border,
  },
  resultMeta: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontWeight: "600",
    color: HUB_COLORS.foreground,
  },
  resultSubtitle: {
    color: HUB_COLORS.muted,
  },
});
