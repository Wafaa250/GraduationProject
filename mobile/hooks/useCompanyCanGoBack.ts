import { useFocusEffect } from "expo-router";
import { router } from "expo-router";
import { useCallback, useState } from "react";

/** True when navigation history exists (e.g. tab root opened via push, not tab bar). */
export function useCompanyCanGoBack(): boolean {
  const [canGoBack, setCanGoBack] = useState(() => router.canGoBack());

  useFocusEffect(
    useCallback(() => {
      setCanGoBack(router.canGoBack());
    }, []),
  );

  return canGoBack;
}
