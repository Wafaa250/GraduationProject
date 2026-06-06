import { router, type Href } from "expo-router";

export function navigateBack(fallbackHref?: Href | string): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  if (fallbackHref) {
    router.replace(fallbackHref as Href);
  }
}
