import Svg, { Circle } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  score: number;
  size?: number;
};

function scoreTone(score: number): string {
  if (score >= 85) return "#10B981";
  if (score >= 70) return "#0EA5E9";
  return "#F59E0B";
}

export function DoctorCompatibilityRing({ score, size = 48 }: Props) {
  const stroke = 3.5;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  const color = scoreTone(score);
  const center = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityLabel={`${score}% match`}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <Text style={[styles.label, { color, fontSize: size <= 40 ? 10 : 12 }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  label: {
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});
