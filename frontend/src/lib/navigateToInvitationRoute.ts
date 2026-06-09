import type { NavigateFunction } from "react-router-dom";

/** Navigate to a notification deep-link, forcing a location update even on the same path. */
export function navigateToInvitationRoute(navigate: NavigateFunction, route: string | null): void {
  const actualRouteBefore = `${window.location.pathname}${window.location.search}`;

  if (!route) {
    console.warn("[NotificationInvitationTrace]", {
      stage: "navigate_skipped",
      generatedRoute: null,
      actualRouteBefore,
      reason: "no_route",
    });
    return;
  }

  let pathname = route;
  let search = "";
  try {
    const url = new URL(route, window.location.origin);
    pathname = url.pathname;
    search = url.search;
  } catch {
    const qIndex = route.indexOf("?");
    if (qIndex >= 0) {
      pathname = route.slice(0, qIndex);
      search = route.slice(qIndex);
    }
  }

  const generatedRoute = `${pathname}${search}`;
  console.log("[NotificationInvitationTrace]", {
    stage: "navigate_call",
    generatedRoute,
    actualRouteBefore,
  });

  navigate(
    { pathname, search },
    { state: { notificationDeepLinkAt: Date.now() } },
  );

  console.log("[NotificationInvitationTrace]", {
    stage: "navigate_dispatched",
    generatedRoute,
    actualRouteVisited: generatedRoute,
  });
}
