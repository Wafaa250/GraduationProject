import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationTextField } from "@/components/association/AssociationTextField";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  visible: boolean;
  skills: string;
  majors: string;
  minMatch: number;
  excludeRejected: boolean;
  busy?: boolean;
  onSkillsChange: (value: string) => void;
  onMajorsChange: (value: string) => void;
  onMinMatchChange: (value: number) => void;
  onExcludeRejectedChange: (value: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function RecruitmentRegenerateModal({
  visible,
  skills,
  majors,
  minMatch,
  excludeRejected,
  busy,
  onSkillsChange,
  onMajorsChange,
  onMinMatchChange,
  onExcludeRejectedChange,
  onConfirm,
  onClose,
}: Props) {
  const layout = useResponsiveLayout();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { borderRadius: layout.radius.button, padding: layout.space("lg") }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Regenerate AI shortlist</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={ASSOC_COLORS.foreground} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 8 }}>
            <AssociationTextField
              label="Prefer skills (comma-separated)"
              value={skills}
              onChangeText={onSkillsChange}
              placeholder="e.g. React, Leadership"
            />
            <AssociationTextField
              label="Prefer majors (comma-separated)"
              value={majors}
              onChangeText={onMajorsChange}
              placeholder="e.g. Computer Science"
            />
            <AssociationTextField
              label="Minimum match score"
              value={String(minMatch)}
              onChangeText={(v) => {
                const n = Number(v);
                if (Number.isFinite(n)) onMinMatchChange(Math.min(100, Math.max(0, n)));
              }}
              keyboardType="numeric"
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Exclude rejected applicants</Text>
              <Switch
                value={excludeRejected}
                onValueChange={onExcludeRejectedChange}
                trackColor={{ false: ASSOC_COLORS.border, true: ASSOC_COLORS.accentSoft }}
                thumbColor={excludeRejected ? ASSOC_COLORS.accent : ASSOC_COLORS.muted}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <AssociationActionButton label="Regenerate" loading={busy} onPress={onConfirm} />
            <AssociationActionButton label="Cancel" variant="outline" onPress={onClose} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: ASSOC_COLORS.overlay },
  sheet: {
    backgroundColor: ASSOC_COLORS.cardBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "85%",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "800", color: ASSOC_COLORS.foreground },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  switchLabel: { fontWeight: "700", color: ASSOC_COLORS.foreground, flex: 1, marginRight: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
});
