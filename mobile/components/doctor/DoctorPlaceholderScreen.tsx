import { Construction } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import {
  DOCTOR_RADIUS,
  DOCTOR_SPACE,
  doctorCardStyle,
  doctorScreenStyle,
  doctorTypography,
} from "@/components/doctor/ui/doctorDesignSystem";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  description: string;
};

export function DoctorPlaceholderScreen({ title, description }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const type = doctorTypography(colors);

  return (
    <DoctorScreen>
      <View style={[styles.center, { paddingHorizontal: layout.horizontalPadding }]}>
        <View style={[doctorCardStyle(colors), styles.card, { padding: DOCTOR_SPACE.xxl }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
            <Construction size={28} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[type.sectionTitle, { fontSize: layout.fontSize.subtitle, textAlign: "center", marginTop: DOCTOR_SPACE.lg }]}>
            {title}
          </Text>
          <Text style={[type.screenSubtitle, { textAlign: "center", marginTop: DOCTOR_SPACE.sm }]}>
            {description}
          </Text>
        </View>
      </View>
    </DoctorScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: DOCTOR_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
