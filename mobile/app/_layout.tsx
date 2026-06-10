import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemePreferenceProvider, useThemePreference } from "@/contexts/ThemePreferenceContext";

function RootNavigation() {
  const { colorScheme, colors } = useThemePreference();

  const navigationTheme =
    colorScheme === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.cardBg,
            text: colors.foreground,
            border: colors.border,
            notification: colors.primary,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.cardBg,
            text: colors.foreground,
            border: colors.border,
            notification: colors.primary,
          },
        };

  return (
    <>
      <ThemeProvider value={navigationTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="register/student" />
          <Stack.Screen name="register/doctor" />
          <Stack.Screen name="register/company" />
          <Stack.Screen name="register/association" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="forgot-password/index" />
          <Stack.Screen name="forgot-password/verify" />
          <Stack.Screen name="forgot-password/reset" />
          <Stack.Screen name="(student)" options={{ headerShown: false }} />
          <Stack.Screen name="students/[userId]" />
          <Stack.Screen name="doctors/[userId]" />
          <Stack.Screen name="companies/[id]" />
          <Stack.Screen name="organizations/[id]" />
          <Stack.Screen name="browse-projects" />
          <Stack.Screen name="browse-project-students" />
          <Stack.Screen name="events/[eventId]" />
          <Stack.Screen name="recruitment/[campaignId]" />
          <Stack.Screen name="projects/[projectId]" />
          <Stack.Screen name="(public)/company/talent-requests/[id]" />
          <Stack.Screen name="opportunities/companies/[companyProfileId]/[requestId]" />
          <Stack.Screen name="doctor" options={{ headerShown: false }} />
          <Stack.Screen name="company" options={{ headerShown: false }} />
          <Stack.Screen name="association" options={{ headerShown: false }} />
          <Stack.Screen name="courses" options={{ headerShown: false }} />
          <Stack.Screen name="graduation-projects" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <RootNavigation />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
