import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  message: string;
  icon?: LucideIcon;
};

export function DoctorSectionEmpty({ message, icon: Icon }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: 12,
          paddingVertical: layout.space("md"),
          paddingHorizontal: layout.space("md"),
          gap: layout.space("sm"),
        },
      ]}
    >
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft, borderRadius: 10, width: 36, height: 36 }]}>
          <Icon size={18} color={colors.primary} strokeWidth={2} />
        </View>
      ) : null}
      <Text style={[styles.message, { fontSize: layout.scale(12.5), flex: 1 }]}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    message: {
      color: colors.muted,
      lineHeight: 17,
      fontWeight: "500",
    },
  });
