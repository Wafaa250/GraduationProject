import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { createDoctorHomeStyles, HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  iconBg?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function DoctorHomeEmptyState({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBg,
  actionLabel,
  onAction,
}: Props) {
  const { colors } = useDoctorTheme();
  const styles = createDoctorHomeStyles(colors);
  const tint = iconColor ?? colors.primary;
  const bg = iconBg ?? colors.primarySoft;

  return (
    <View style={[styles.emptyState, styles.cardShadow]}>
      <View style={[styles.emptyIconWrap, { backgroundColor: bg }]}>
        <Icon size={22} color={tint} strokeWidth={2} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.emptyAction} hitSlop={HOME_SPACE.xs}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
