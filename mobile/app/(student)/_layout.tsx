import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HUB_COLORS } from "@/constants/studentHubTheme";
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

export default function StudentTabLayout() {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const tabBarHeight = layout.scale(56) + insets.bottom;

  return (
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
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? "notifications" : "notifications-outline", focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? "person" : "person-outline", focused),
        }}
      />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
    </Tabs>
  );
}
