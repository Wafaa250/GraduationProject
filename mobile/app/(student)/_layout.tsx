import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HubProfileMenuSheet } from "@/components/communication/HubProfileMenuSheet";
import { StudentRouteGuard } from "@/components/student/StudentRouteGuard";
import { HubAccountMenuProvider, useHubAccountMenu } from "@/contexts/HubAccountMenuContext";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

function StudentTabs() {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const tabBarHeight = layout.scale(52) + insets.bottom;
  const { menuOpen, menuAnchor, closeMenu } = useHubAccountMenu();

  const tabIcon = (name: keyof typeof Ionicons.glyphMap, focused: boolean) => (
    <Ionicons name={name} size={22} color={focused ? colors.primary : colors.muted} />
  );

  const handleMenuNavigate = (action: "profile" | "settings" | "logout") => {
    if (action === "profile") {
      router.push("/profile");
      return;
    }
    if (action === "settings") {
      router.push("/settings");
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 6,
          },
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingTop: 4,
            paddingBottom: Math.max(insets.bottom, 6),
          },
        }}
      >
        <Tabs.Screen
          name="feed"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused ? "home" : "home-outline", focused),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused ? "chatbubbles" : "chatbubbles-outline", focused),
          }}
        />
        <Tabs.Screen
          name="following"
          options={{
            title: "Following",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused ? "people" : "people-outline", focused),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ focused }) =>
              tabIcon(focused ? "grid" : "grid-outline", focused),
          }}
        />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="edit-profile" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="more" options={{ href: null }} />
      </Tabs>

      <HubProfileMenuSheet
        visible={menuOpen}
        anchor={menuAnchor}
        onClose={closeMenu}
        onNavigate={handleMenuNavigate}
      />
    </>
  );
}

export default function StudentTabLayout() {
  return (
    <StudentRouteGuard>
      <HubAccountMenuProvider>
        <StudentTabs />
      </HubAccountMenuProvider>
    </StudentRouteGuard>
  );
}
