import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AssociationWorkspaceScreen } from "@/components/association/AssociationWorkspaceScreen";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function AssociationPlaceholderScreen({
  title,
  description,
  icon = "construct-outline",
}: Props) {
  const layout = useResponsiveLayout();

  return (
    <AssociationWorkspaceScreen>
      <View style={[styles.card, { borderRadius: layout.radius.button, padding: layout.space("xl") }]}>
        <View style={[styles.iconWrap, { borderRadius: layout.radius.input }]}>
          <Ionicons name={icon} size={layout.scale(28)} color={ASSOC_COLORS.accentDark} />
        </View>
        <Text style={[styles.title, { fontSize: layout.fontSize.title, marginTop: layout.space("md") }]}>
          {title}
        </Text>
        <Text style={[styles.description, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
          {description ?? "This workspace screen is coming soon on mobile."}
        </Text>
      </View>
    </AssociationWorkspaceScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ASSOC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    width: "100%",
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ASSOC_COLORS.accentMuted,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  title: {
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    textAlign: "center",
  },
  description: {
    color: ASSOC_COLORS.muted,
    lineHeight: 22,
    textAlign: "center",
  },
});
