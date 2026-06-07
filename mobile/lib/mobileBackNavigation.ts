import { router, type Href } from "expo-router";

/** Prefer navigation history; only use fallback when there is no prior screen. */
export function navigateBack(fallbackHref?: Href | string): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  if (fallbackHref) {
    router.replace(fallbackHref as Href);
  }
}
