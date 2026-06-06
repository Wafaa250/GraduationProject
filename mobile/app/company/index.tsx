import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WorkspaceAccountHeader } from "@/components/navigation/WorkspaceAccountHeader";
import { AUTH_COLORS } from "@/constants/authTheme";

export default function CompanyDashboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <WorkspaceAccountHeader profileHref="/company" settingsHref="/company" avatarRole="company" />
      <View style={styles.content}>
        <Text style={styles.title}>Company Dashboard</Text>
        <Text style={styles.subtitle}>Authenticated company home route.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AUTH_COLORS.background },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", color: AUTH_COLORS.foreground },
  subtitle: { marginTop: 8, color: AUTH_COLORS.muted, textAlign: "center" },
});
