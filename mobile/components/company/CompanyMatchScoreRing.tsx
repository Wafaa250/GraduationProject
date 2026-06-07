import Svg, { Circle } from "react-native-svg";
import { Text, View } from "react-native";

import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Props = {
  score: number;
  size?: number;
};

export function CompanyMatchScoreRing({ score, size = 52 }: Props) {
  const colors = useCompanyTheme();
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceMuted}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: size < 48 ? 13 : 15, fontWeight: "800", color: colors.accent }}>
        {score}
      </Text>
    </View>
  );
}
