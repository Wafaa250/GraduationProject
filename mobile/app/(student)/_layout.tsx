import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HubProfileMenuSheet } from "@/components/communication/HubProfileMenuSheet";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { HubAccountMenuProvider, useHubAccountMenu } from "@/contexts/HubAccountMenuContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type TabIconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIconName, focused: boolean) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? HUB_COLORS.primary : HUB_COLORS.muted}
    />
  );
}

function StudentTabs() {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const tabBarHeight = layout.scale(56) + insets.bottom;
  const { menuOpen, closeMenu } = useHubAccountMenu();

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
          tabBarActiveTintColor: HUB_COLORS.primary,
          tabBarInactiveTintColor: HUB_COLORS.muted,
          tabBarLabelStyle: {
            fontSize: layout.scale(11),
            fontWeight: "600",
            marginBottom: Platform.OS === "ios" ? 0 : 4,
          },
          tabBarStyle: {
            backgroundColor: HUB_COLORS.tabBarBg,
            borderTopColor: HUB_COLORS.tabBarBorder,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 8),
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
        onClose={closeMenu}
        onNavigate={handleMenuNavigate}
      />
    </>
  );
}

export default function StudentTabLayout() {
  return (
    <HubAccountMenuProvider>
      <StudentTabs />
    </HubAccountMenuProvider>
  );
}
