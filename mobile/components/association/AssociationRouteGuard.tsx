import { router, type Href } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { getItem } from "@/utils/authStorage";
import { getHomePath } from "@/utils/homeNavigation";
import { isAssociationRole } from "@/utils/organizationRole";

type Props = {
  children: ReactNode;
};

export function AssociationRouteGuard({ children }: Props) {
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

      if (!isAssociationRole(role)) {
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
      <View style={{ flex: 1, backgroundColor: ASSOC_COLORS.background }}>
        {allowed ? children : <AssociationLoadingState message="Checking access…" />}
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={{ flex: 1, backgroundColor: ASSOC_COLORS.background, justifyContent: "center" }}>
        <ActivityIndicator color={ASSOC_COLORS.accent} />
      </View>
    );
  }

  return <>{children}</>;
}
