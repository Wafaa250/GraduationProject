import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";

import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { spacing } from "@/constants/responsiveLayout";

export default function CommunityEventsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Community Events" subtitle="Campus events hub" onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.sub}>
          Browse upcoming events from student organizations across campus — all in one place.
        </Text>
        <Text style={styles.cta} onPress={() => router.push("/organizations" as Href)}>
          Discover organizations →
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  body: {
    flex: 1,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800", color: assocColors.text },
  sub: { marginTop: spacing.md, fontSize: 14, color: assocColors.muted, textAlign: "center", lineHeight: 20 },
  cta: { marginTop: spacing.xl, fontSize: 14, fontWeight: "700", color: assocColors.accentDark },
});
