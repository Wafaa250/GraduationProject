import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useHubDesign } from "@/hooks/use-hub-design";

export type PublicLinkItem = {
  key: string;
  label: string;
  value: string;
  href?: string | null;
};

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type Props = {
  items: PublicLinkItem[];
};

export function PublicLinkList({ items }: Props) {
  const hub = useHubDesign();
  const { colors } = hub;
  const visible = items.filter((item) => item.value.trim());
  if (visible.length === 0) {
    return <Text style={[styles.empty, { color: colors.muted }]}>No links provided yet.</Text>;
  }

  return (
    <View style={{ gap: 8 }}>
      {visible.map((item) => {
        const href = item.href?.trim() ? normalizeUrl(item.href) : normalizeUrl(item.value);
        return (
          <Pressable
            key={item.key}
            style={[styles.row, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            onPress={() => void Linking.openURL(href)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.value, { color: colors.primary }]} numberOfLines={2}>
                {item.value}
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "600" },
});
