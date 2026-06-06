import { ChevronRight, Users } from "lucide-react-native";
import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { createDoctorHomeStyles, HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import type { DoctorHubProjectCardModel } from "@/lib/doctorHubMappers";
import { doctorProjectPath } from "@/lib/doctorRoutes";

type Props = {
  project: DoctorHubProjectCardModel;
  showDivider?: boolean;
};

export function DoctorHomeProjectRow({ project, showDivider }: Props) {
  const { colors } = useHubTheme();
  const styles = createDoctorHomeStyles(colors);

  return (
    <View>
      {showDivider ? (
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: HOME_SPACE.md }} />
      ) : null}
      <Pressable
        onPress={() => router.push(doctorProjectPath(Number(project.id)) as Href)}
        style={({ pressed }) => ({
          paddingVertical: HOME_SPACE.md,
          paddingHorizontal: HOME_SPACE.md,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <View style={[styles.pill, { backgroundColor: colors.roleBg.doctor, marginBottom: 8 }]}>
          <Text style={[styles.pillText, { color: colors.doctor, textTransform: "uppercase", letterSpacing: 0.4 }]}>
            {project.category}
          </Text>
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, lineHeight: 21 }} numberOfLines={2}>
          {project.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Users size={13} color={colors.muted} strokeWidth={2} />
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>{project.memberCount} members</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>·</Text>
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }} numberOfLines={1}>
              {project.updated.replace("Created ", "")}
            </Text>
          </View>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={16} color={colors.primary} strokeWidth={2.5} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}
