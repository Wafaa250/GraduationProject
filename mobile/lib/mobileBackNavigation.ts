import { router, type Href } from "expo-router";

export function navigateBack(fallbackHref?: Href | string): void {
  if (fallbackHref) {
    router.replace(fallbackHref as Href);
    return;
  }
  if (router.canGoBack()) {
    router.back();
  }
}
