import { router, type Href } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { getItem } from "@/utils/authStorage";
import { getHomePath } from "@/utils/homeNavigation";

type Props = {
  children: ReactNode;
};

export function DoctorRouteGuard({ children }: Props) {
  const { colors } = useHubTheme();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const styles = createStyles(colors);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const token = await getItem("token");
      const role = await getItem("role");

      if (cancelled) return;

      if (!token) {
        router.replace("/login" as Href);
        return;
      }

      if ((role ?? "").toLowerCase() !== "doctor") {
        router.replace((await getHomePath()) as Href);
        return;
      }

      setAllowed(true);
      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        {allowed ? children : <ActivityIndicator size="large" color={colors.primary} />}
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const createStyles = (colors: HubColorScheme) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
});
