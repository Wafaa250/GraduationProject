import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState, type ReactNode } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  title: string;
  children: ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  summary?: string;
  defaultExpanded?: boolean;
};

export function ProfileAccordionSection({
  title,
  children,
  icon,
  summary,
  defaultExpanded = false,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={[styles.card, { borderRadius: layout.radius.button }]}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${expanded ? "expanded" : "collapsed"}`}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-forward"}
          size={18}
          color={colors.muted}
        />
        {icon ? (
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={15} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {!expanded && summary ? (
            <Text style={styles.summary} numberOfLines={2}>
              {summary}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    card: {
      width: "100%",
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    headerPressed: {
      backgroundColor: colors.inputBg,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
    },
    summary: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 18,
    },
    body: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
      gap: 10,
    },
  });
}
