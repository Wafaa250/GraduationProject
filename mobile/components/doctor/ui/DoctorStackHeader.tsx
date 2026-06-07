import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Href } from "expo-router";

import { MobileBackButton } from "@/components/navigation/MobileBackButton";
import {
  DOCTOR_RADIUS,
  DOCTOR_SPACE,
  doctorTypography,
} from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

type Props = {
  title: string;
  subtitle?: string;
  fallbackHref?: Href | string;
  onBackPress?: () => void;
  rightSlot?: ReactNode;
  variant?: "large" | "compact";
  showBack?: boolean;
};

export function DoctorStackHeader({
  title,
  subtitle,
  fallbackHref = DOCTOR_ROUTES.dashboard,
  onBackPress,
  rightSlot,
  variant = "large",
  showBack = true,
}: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);
  const type = doctorTypography(colors);
  const resolvedFallback = fallbackHref ?? DOCTOR_ROUTES.dashboard;

  if (variant === "compact") {
    return (
      <View
        style={[
          styles.compactBar,
          {
            paddingHorizontal: layout.horizontalPadding,
            minHeight: layout.scale(48),
          },
        ]}
      >
        <View style={styles.compactSide}>
          {showBack ? (
            <MobileBackButton fallbackHref={resolvedFallback} color={colors.foreground} onPress={onBackPress} />
          ) : (
            <View style={{ width: layout.scale(44) }} />
          )}
        </View>
        <Text
          style={[styles.compactTitle, { fontSize: layout.fontSize.label, color: colors.foreground }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <View style={[styles.compactSide, styles.compactRight]}>
          {rightSlot ?? <View style={{ width: layout.scale(44) }} />}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.largeWrap,
        {
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: DOCTOR_SPACE.xs,
          paddingBottom: subtitle ? DOCTOR_SPACE.md : DOCTOR_SPACE.sm,
        },
      ]}
    >
      <View style={styles.largeTopRow}>
        {showBack ? (
          <MobileBackButton fallbackHref={resolvedFallback} color={colors.foreground} onPress={onBackPress} />
        ) : (
          <View style={{ width: layout.scale(44) }} />
        )}
        <View style={styles.largeRight}>{rightSlot}</View>
      </View>

      <Text style={[type.screenTitle, { fontSize: layout.fontSize.title, marginTop: DOCTOR_SPACE.xs }]} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[type.screenSubtitle, { marginTop: DOCTOR_SPACE.xs }]} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    largeWrap: {
      backgroundColor: colors.cardBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    largeTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 40,
    },
    largeRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: DOCTOR_SPACE.sm,
      marginLeft: "auto",
    },
    compactBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    compactSide: {
      minWidth: 44,
      width: 44,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    compactRight: {
      alignItems: "flex-end",
    },
    compactTitle: {
      flex: 1,
      textAlign: "center",
      fontWeight: "700",
    },
  });
}
