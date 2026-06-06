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
          <Stack.Screen name="doctor/dashboard" />
          <Stack.Screen name="company/index" />
          <Stack.Screen name="association/dashboard" />
          <Stack.Screen name="courses" options={{ headerShown: false }} />
          <Stack.Screen name="graduation-projects" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
