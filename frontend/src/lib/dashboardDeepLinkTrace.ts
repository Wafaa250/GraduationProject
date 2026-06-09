export function logDashboardDeepLink(
  stage: string,
  data?: Record<string, unknown>,
): void {
  console.log("[DashboardDeepLinkTrace]", { stage, ...data });
}
