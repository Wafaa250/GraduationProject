import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="doctor-dashboard" />
          <Stack.Screen name="StudentsPage" />
          <Stack.Screen name="ProfilePage" />
          <Stack.Screen name="StudentProfilePage" />
          <Stack.Screen name="StudentPublicProfilePage" />
          <Stack.Screen name="DoctorPublicProfilePage" />
          <Stack.Screen name="ChatPage" />
          <Stack.Screen name="NotificationsPage" />
          <Stack.Screen name="StudentTeamPage" />
          <Stack.Screen name="StudentAiTeamPage" />
          <Stack.Screen name="StudentTeamChoicePage" />
          <Stack.Screen name="CourseManualTeamPage" />
          <Stack.Screen name="courses" />
          <Stack.Screen name="organization" />
          <Stack.Screen name="public-organizations" />
          <Stack.Screen name="EditProfilePage" />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal", headerShown: true }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
