import {
  Bookmark,
  Briefcase,
  FileText,
  LayoutDashboard,
  User,
} from "lucide-react-native";
import { Tabs } from "expo-router";

import { CompanyTabBar } from "@/components/company/CompanyTabBar";

const TAB_LABELS = {
  dashboard: "Dashboard",
  requests: "Requests",
  saved: "Saved",
  workspace: "Workspace",
  profile: "Profile",
} as const;

export default function CompanyMainTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CompanyTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: TAB_LABELS.dashboard,
          tabBarAccessibilityLabel: "Dashboard",
          tabBarIcon: ({ focused, color, size }) => (
            <LayoutDashboard size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: TAB_LABELS.requests,
          tabBarAccessibilityLabel: "Project Requests",
          tabBarIcon: ({ focused, color, size }) => (
            <FileText size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: TAB_LABELS.saved,
          tabBarAccessibilityLabel: "Saved Recommendations",
          tabBarIcon: ({ focused, color, size }) => (
            <Bookmark size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="workspace"
        options={{
          title: TAB_LABELS.workspace,
          tabBarAccessibilityLabel: "Workspace",
          tabBarIcon: ({ focused, color, size }) => (
            <Briefcase size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: TAB_LABELS.profile,
          tabBarAccessibilityLabel: "Company Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="discovery" options={{ href: null }} />
    </Tabs>
  );
}
