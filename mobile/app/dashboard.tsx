import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";

import { StudentDashboardScreen } from "@/components/student-dashboard/StudentDashboardScreen";
import { spacing } from "@/constants/responsiveLayout";
import { getItem } from "@/utils/authStorage";
import { isAssociationRole } from "@/utils/organizationRole";

/**
 * Student dashboard shell. The primary header (notifications, messages, settings, profile)
 * is implemented in `StudentDashboardScreen`.
 */
export default function DashboardScreen() {
  const [gate, setGate] = useState<"loading" | "student" | "redirect">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const role = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
      if (cancelled) return;
      if (role === "doctor") {
        setGate("redirect");
        router.replace("/doctor-dashboard" as Href);
        return;
      }
      if (isAssociationRole(role)) {
        setGate("redirect");
        router.replace("/organization/dashboard" as Href);
        return;
      }
      setGate("student");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (gate === "loading" || gate === "redirect") {
    return (
      <View style={styles.gate}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return <StudentDashboardScreen />;
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f7ff",
    padding: spacing.xl,
  },
});
