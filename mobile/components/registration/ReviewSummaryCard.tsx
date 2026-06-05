import { Pressable, StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export type ReviewRow = {
  label: string;
  value: string;
};

type ReviewSummaryCardProps = {
  title: string;
  rows: ReviewRow[];
  onEdit: () => void;
};

export function ReviewSummaryCard({ title, rows, onEdit }: ReviewSummaryCardProps) {
  const layout = useResponsiveLayout();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius.button,
          padding: layout.space("lg"),
          marginBottom: layout.space("md"),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: layout.scale(17) }]}>{title}</Text>
        <Pressable onPress={onEdit} hitSlop={8} style={styles.editBtn}>
          <Text style={[styles.editText, { fontSize: layout.fontSize.footer }]}>Edit</Text>
        </Pressable>
      </View>

      <View style={{ gap: layout.space("sm"), marginTop: layout.space("md") }}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={[styles.rowLabel, { fontSize: layout.fontSize.footer }]}>{row.label}</Text>
            <Text style={[styles.rowValue, { fontSize: layout.fontSize.footer }]}>{row.value || "—"}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: AUTH_COLORS.cardBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontWeight: "700",
    color: AUTH_COLORS.foreground,
  },
  editBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editText: {
    color: AUTH_COLORS.primary,
    fontWeight: "700",
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    color: AUTH_COLORS.muted,
    fontWeight: "600",
  },
  rowValue: {
    color: AUTH_COLORS.foreground,
    lineHeight: 20,
  },
});
