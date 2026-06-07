import { Stack } from "expo-router";

import { CompanyAccountMenuProvider } from "@/components/company/CompanyAccountMenuProvider";
import { CompanyRouteGuard } from "@/components/company/CompanyRouteGuard";
import { CompanyWorkspaceThemeProvider } from "@/contexts/CompanyWorkspaceThemeContext";

export default function CompanyLayout() {
  return (
    <CompanyWorkspaceThemeProvider>
      <CompanyRouteGuard>
        <CompanyAccountMenuProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(main)" />
            <Stack.Screen name="edit-profile" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="members" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="themes" options={{ animation: "slide_from_right" }} />
          </Stack>
        </CompanyAccountMenuProvider>
      </CompanyRouteGuard>
    </CompanyWorkspaceThemeProvider>
  );
}
