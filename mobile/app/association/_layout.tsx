import {
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  UsersRound,
} from "lucide-react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AssociationRouteGuard } from "@/components/association/AssociationRouteGuard";
import { AssociationTabBarButton } from "@/components/association/AssociationTabBarButton";
import { AssociationTabIcon } from "@/components/association/AssociationTabIcon";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { AssociationWorkspaceProvider } from "@/contexts/AssociationWorkspaceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

/** Tab labels — must match web `AssociationSidebar` NAV exactly. */
const TAB_LABELS = {
  dashboard: "Dashboard",
  events: "Events",
  recruitment: "Selection Applications",
  leadership: "Leadership Board",
  profile: "Organization Profile",
} as const;

function AssociationTabs() {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const tabBarHeight = layout.scale(64) + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: ASSOC_COLORS.accent,
        tabBarInactiveTintColor: ASSOC_COLORS.muted,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          marginTop: 2,
          textAlign: "center",
        },
        tabBarButton: (props) => <AssociationTabBarButton {...props} />,
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 4,
          minHeight: layout.touchTarget,
        },
        tabBarStyle: {
          backgroundColor: ASSOC_COLORS.cardBg,
          borderTopColor: ASSOC_COLORS.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 4,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: TAB_LABELS.dashboard,
          tabBarIcon: ({ focused }) => (
            <AssociationTabIcon icon={LayoutDashboard} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: TAB_LABELS.events,
          tabBarIcon: ({ focused }) => (
            <AssociationTabIcon icon={CalendarDays} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="recruitment"
        options={{
          title: TAB_LABELS.recruitment,
          tabBarIcon: ({ focused }) => (
            <AssociationTabIcon icon={ClipboardList} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leadership"
        options={{
          title: TAB_LABELS.leadership,
          tabBarIcon: ({ focused }) => (
            <AssociationTabIcon icon={UsersRound} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: TAB_LABELS.profile,
          tabBarIcon: ({ focused }) => (
            <AssociationTabIcon icon={Building2} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}

export default function AssociationLayout() {
  return (
    <AssociationRouteGuard>
      <AssociationWorkspaceProvider>
        <AssociationTabs />
      </AssociationWorkspaceProvider>
    </AssociationRouteGuard>
  );
}
