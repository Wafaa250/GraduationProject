import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";

import { spacing } from "@/constants/responsiveLayout";

const COMMUNITY_PREFIXES = [
  "/communities",
  "/organizations",
  "/following",
  "/community-events",
  "/community-recruitment",
];

function isCommunitiesArea(pathname: string) {
  return COMMUNITY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function CommunitiesNavLink() {
  const pathname = usePathname();
  const active = isCommunitiesArea(pathname);

  return (
    <Pressable
      onPress={() => router.push("/communities" as Href)}
      style={({ pressed }) => [
        styles.iconBtn,
        active && styles.iconBtnActive,
        pressed && !active && styles.iconBtnPressed,
        pressed && active && styles.iconBtnActivePressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Student Communities"
      accessibilityHint="Open campus communities hub"
      accessibilityState={{ selected: active }}
    >
      <View style={styles.glyphWrap}>
        <Ionicons name="compass-outline" size={22} color={active ? "#4f46e5" : "#818cf8"} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  iconBtnPressed: {
    backgroundColor: "rgba(99, 102, 241, 0.16)",
    borderColor: "rgba(199, 210, 254, 0.45)",
  },
  iconBtnActive: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  iconBtnActivePressed: {
    backgroundColor: "#e0e7ff",
  },
  glyphWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
