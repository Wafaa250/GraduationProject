import { useEffect, useRef } from "react";
import { Animated, ScrollView, View } from "react-native";

import { createDoctorHomeStyles, HOME_SPACE, STAT_CHIP_WIDTH } from "@/components/doctor/home/doctorHomeStyles";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

function Block({ width, height, radius = 8 }: { width: number | `${number}%`; height: number; radius?: number }) {
  const { colors } = useDoctorTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ width, height, borderRadius: radius, backgroundColor: colors.border, opacity }}
    />
  );
}

export function DoctorHomeSkeleton() {
  return (
    <View>
      <Block width="100%" height={140} radius={16} />
      <View style={{ marginTop: HOME_SPACE.lg }}>
        <Block width="30%" height={18} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: HOME_SPACE.sm }}
          contentContainerStyle={{ gap: HOME_SPACE.sm, paddingRight: HOME_SPACE.xl }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Block key={i} width={STAT_CHIP_WIDTH} height={118} radius={14} />
          ))}
        </ScrollView>
      </View>
      <View style={{ marginTop: HOME_SPACE.lg }}>
        <Block width="50%" height={18} />
        <View style={{ marginTop: HOME_SPACE.sm }}>
          <Block width="100%" height={130} radius={14} />
        </View>
      </View>
    </View>
  );
}
