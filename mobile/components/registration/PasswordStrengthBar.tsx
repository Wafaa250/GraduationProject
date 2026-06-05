import { StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["", "#EF4444", "#F59E0B", "#10B981", AUTH_COLORS.primary];

type PasswordStrengthBarProps = {
  password: string;
};

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const layout = useResponsiveLayout();

  if (!password.length) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  return (
    <View style={[styles.wrap, { gap: layout.space("sm"), marginBottom: layout.space("md") }]}>
      <View style={[styles.bars, { gap: layout.space("xs") }]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i < score ? COLORS[score] : AUTH_COLORS.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { fontSize: layout.scale(12), color: COLORS[score] }]}>
        {LABELS[score]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  bars: {
    flex: 1,
    flexDirection: "row",
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  label: {
    fontWeight: "700",
    minWidth: 44,
    textAlign: "right",
  },
});
