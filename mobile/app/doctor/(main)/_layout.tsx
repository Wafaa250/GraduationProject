import {
  BookOpen,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  User,
} from "lucide-react-native";
import { Tabs } from "expo-router";

import { DoctorTabBar } from "@/components/doctor/DoctorTabBar";

const TAB_LABELS = {
  dashboard: "Dashboard",
  requests: "Requests",
  projects: "Projects",
  courses: "Courses",
  profile: "Profile",
} as const;

export default function DoctorMainTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <DoctorTabBar {...props} />}
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
          tabBarAccessibilityLabel: "Supervision Requests",
          tabBarIcon: ({ focused, color, size }) => (
            <ClipboardList size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: TAB_LABELS.projects,
          tabBarAccessibilityLabel: "Active Projects",
          tabBarIcon: ({ focused, color, size }) => (
            <FolderKanban size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: TAB_LABELS.courses,
          tabBarAccessibilityLabel: "Courses",
          tabBarIcon: ({ focused, color, size }) => (
            <BookOpen size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: TAB_LABELS.profile,
          tabBarAccessibilityLabel: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
