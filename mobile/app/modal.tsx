import { Link } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, maxDashboardWidth, isTablet } = useResponsiveLayout();
  const kavBehavior = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={kavBehavior}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: Math.max(spacing.lg, insets.bottom),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedView
            style={[
              styles.inner,
              {
                maxWidth: maxDashboardWidth,
                alignSelf: isTablet ? "center" : "stretch",
                width: "100%",
              },
            ]}
          >
            <ThemedText type="title" style={styles.title}>
              This is a modal
            </ThemedText>
            <ThemedText type="subtitle" style={styles.lead}>
              Example modal content that scrolls on small screens and stays within a comfortable reading width
              on tablets.
            </ThemedText>
            <Link href="/" dismissTo style={styles.link}>
              <ThemedText type="link">Go to home screen</ThemedText>
            </Link>
            <View style={styles.spacer} />
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: spacing.xl,
  },
  inner: {
    gap: spacing.md,
    minHeight: 120,
  },
  title: {
    flexShrink: 1,
  },
  lead: {
    flexShrink: 1,
    lineHeight: 26,
  },
  link: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignSelf: "flex-start",
  },
  spacer: {
    minHeight: spacing.lg,
  },
});
