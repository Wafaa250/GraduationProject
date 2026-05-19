import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";

import { companyColors } from "@/constants/companyTheme";
import { spacing } from "@/constants/responsiveLayout";
import { getItem } from "@/utils/authStorage";
import { isAssociationRole } from "@/utils/organizationRole";

export function CompanyGate({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<"loading" | "ok">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = ((await getItem("token")) ?? "").trim();
      const role = ((await getItem("role")) ?? "").trim().toLowerCase();
      if (cancelled) return;
      if (!token) {
        router.replace("/login" as Href);
        return;
      }
      if (role !== "company") {
        if (role === "doctor") router.replace("/doctor-dashboard" as Href);
        else if (isAssociationRole(role)) router.replace("/organization/dashboard" as Href);
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
        <ActivityIndicator color={companyColors.accent} size="large" />
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
    backgroundColor: companyColors.bg,
    padding: spacing.xl,
  },
});
