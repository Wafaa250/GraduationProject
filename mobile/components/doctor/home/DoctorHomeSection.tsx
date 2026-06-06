import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { createDoctorHomeStyles, HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";

type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  count?: number;
  seeAllLabel?: string;
  onSeeAll?: () => void;
  children: ReactNode;
};

export function DoctorHomeSection({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  count,
  seeAllLabel = "See all",
  onSeeAll,
  children,
}: Props) {
  const { colors } = useHubTheme();
  const styles = createDoctorHomeStyles(colors);
  const tint = iconColor ?? colors.primary;
  const bg = iconBg ?? colors.primarySoft;

  return (
    <View style={{ marginBottom: HOME_SPACE.xl }}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.sectionTitleRow}>
            {Icon ? (
              <View style={[styles.sectionIconWrap, { backgroundColor: bg }]}>
                <Icon size={16} color={tint} strokeWidth={2.2} />
              </View>
            ) : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {count != null && count > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{count > 99 ? "99+" : count}</Text>
                  </View>
                ) : null}
              </View>
              {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
            </View>
          </View>
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAllPill}>
            <Text style={styles.seeAll}>{seeAllLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
