import { ArrowUpRight, Users } from "lucide-react-native";
import { router, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { DoctorHubProjectCardModel } from "@/lib/doctorHubMappers";
import { doctorProjectPath } from "@/lib/doctorRoutes";

type Props = {
  projects: DoctorHubProjectCardModel[];
};

export function DoctorProjectCarousel({ projects }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cardWidth = layout.deviceSize === "tablet" ? layout.scale(300) : layout.scale(260);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + layout.space("sm")}
      contentContainerStyle={{ gap: layout.space("sm"), paddingRight: layout.space("md") }}
    >
      {projects.map((project) => (
        <Pressable
          key={project.id}
          onPress={() => router.push(doctorProjectPath(Number(project.id)) as Href)}
          style={({ pressed }) => [
            styles.card,
            {
              width: cardWidth,
              borderRadius: 16,
              padding: layout.space("md"),
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={[styles.category, { fontSize: layout.scale(10) }]} numberOfLines={1}>
            {project.category}
          </Text>
          <Text
            style={[styles.title, { fontSize: layout.scale(15), marginTop: 4 }]}
            numberOfLines={2}
          >
            {project.title}
          </Text>

          <View style={[styles.membersRow, { marginTop: layout.space("md") }]}>
            <View style={styles.avatarStack}>
              {project.members.slice(0, 3).map((member, index) => (
                <View
                  key={`${member.name}-${index}`}
                  style={[
                    styles.memberAvatar,
                    {
                      width: layout.scale(26),
                      height: layout.scale(26),
                      borderRadius: layout.scale(13),
                      marginLeft: index === 0 ? 0 : -8,
                    },
                  ]}
                >
                  <Text style={[styles.memberInitials, { fontSize: layout.scale(9) }]}>
                    {member.initials}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.memberMeta}>
              <Users size={layout.scale(12)} color={colors.muted} strokeWidth={2} />
              <Text style={[styles.memberCount, { fontSize: layout.scale(11), marginLeft: 4 }]}>
                {project.memberCount} members
              </Text>
            </View>
          </View>

          <View style={[styles.footer, { marginTop: layout.space("md") }]}>
            <Text style={[styles.updated, { fontSize: layout.scale(11) }]} numberOfLines={1}>
              {project.updated}
            </Text>
            <View style={styles.openHint}>
              <Text style={[styles.openText, { fontSize: layout.scale(11) }]}>Open</Text>
              <ArrowUpRight size={layout.scale(12)} color={colors.primary} strokeWidth={2.5} />
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 2,
    },
    category: {
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: colors.muted,
    },
    title: {
      fontWeight: "800",
      color: colors.foreground,
      lineHeight: 20,
      minHeight: 40,
    },
    membersRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    avatarStack: {
      flexDirection: "row",
      alignItems: "center",
    },
    memberAvatar: {
      backgroundColor: colors.primarySoft,
      borderWidth: 2,
      borderColor: colors.cardBg,
      alignItems: "center",
      justifyContent: "center",
    },
    memberInitials: {
      fontWeight: "700",
      color: colors.primary,
    },
    memberMeta: {
      flexDirection: "row",
      alignItems: "center",
    },
    memberCount: {
      color: colors.muted,
      fontWeight: "600",
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    updated: {
      color: colors.muted,
      flex: 1,
      marginRight: 8,
    },
    openHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    openText: {
      color: colors.primary,
      fontWeight: "700",
    },
  });
