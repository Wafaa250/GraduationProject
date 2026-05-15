import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";

import { spacing } from "@/constants/responsiveLayout";
import { getItem } from "@/utils/authStorage";
import { isAssociationRole } from "@/utils/organizationRole";

/**
 * Ensures only student-organization accounts can open `/organization/*` routes.
 */
export function OrganizationGate({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<"loading" | "ok">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = ((await getItem("token")) ?? "").trim();
      const role = ((await getItem("role")) ?? "").trim();
      if (cancelled) return;
      if (!token) {
        router.replace("/login" as Href);
        return;
      }
      if (!isAssociationRole(role)) {
        const r = role.toLowerCase();
        if (r === "doctor") router.replace("/doctor-dashboard" as Href);
        else router.replace("/dashboard" as Href);
        return;
      }
      if (!cancelled) setGate("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (gate !== "ok") {
    return (
      <View style={styles.gate}>
        <ActivityIndicator color="#d97706" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: spacing.xl,
  },
});
