import { StyleSheet, Text, View } from "react-native";

import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function AssociationListEmpty({ title, description, actionLabel, onAction }: Props) {
  const layout = useResponsiveLayout();

  return (
    <View style={[associationCardStyles.card, styles.card, { padding: layout.space("lg") }]}>
      <Text style={[styles.title, { fontSize: layout.fontSize.subtitle }]}>{title}</Text>
      <Text style={[styles.description, { fontSize: layout.fontSize.body, marginTop: layout.space("sm") }]}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: layout.space("lg") }}>
          <AssociationActionButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderStyle: "dashed",
  },
  title: {
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    textAlign: "center",
  },
  description: {
    color: ASSOC_COLORS.muted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
});
