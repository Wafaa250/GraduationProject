import { router, type Href } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { getItem } from "@/utils/authStorage";
import { isCompanyWorkspaceAccountRole } from "@/utils/companyAccountRole";
import { getHomePath } from "@/utils/homeNavigation";

type Props = {
  children: ReactNode;
};

export function CompanyRouteGuard({ children }: Props) {
  const colors = useCompanyTheme();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

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

      if (!isCompanyWorkspaceAccountRole(role)) {
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

  if (checking || !allowed) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <>{children}</>;
}
