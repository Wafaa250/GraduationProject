import { StyleSheet, Text, View } from "react-native";

import { useHubDesign } from "@/hooks/use-hub-design";

type Stat = {
  label: string;
  value: string | number;
};

type Props = {
  stats: Stat[];
};

export function PublicProfileStatGrid({ stats }: Props) {
  const hub = useHubDesign();
  const { colors } = hub;

  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={[styles.item, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
        >
          <Text style={[styles.value, { color: colors.foreground }]}>{stat.value}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  item: {
    flex: 1,
    minWidth: "30%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
