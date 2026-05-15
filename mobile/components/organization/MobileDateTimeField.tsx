import { useCallback, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { radius, spacing } from "@/constants/responsiveLayout";
import { assocColors } from "@/constants/associationTheme";

function mergeDateTime(base: Date, timeSource: Date): Date {
  const d = new Date(base);
  d.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
  return d;
}

type Props = {
  label: string;
  valueIso: string;
  onChangeIso: (iso: string) => void;
};

/**
 * Android-first friendly datetime selector producing ISO strings for the API.
 */
export function MobileDateTimeField({ label, valueIso, onChangeIso }: Props) {
  const current = useMemo(() => {
    const d = valueIso ? new Date(valueIso) : new Date();
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [valueIso]);

  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(current);

  const display = valueIso
    ? new Date(valueIso).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const openAndroid = useCallback(() => {
    DateTimePickerAndroid.open({
      mode: "date",
      value: current,
      onChange: (ev, datePicked) => {
        if (ev.type !== "set" || !datePicked) return;
        DateTimePickerAndroid.open({
          mode: "time",
          value: mergeDateTime(datePicked, current),
          onChange: (ev2, timePicked) => {
            if (ev2.type !== "set" || !timePicked) return;
            const merged = mergeDateTime(datePicked, timePicked);
            onChangeIso(merged.toISOString());
          },
        });
      },
    });
  }, [current, onChangeIso]);

  const openPicker = () => {
    if (Platform.OS === "android") {
      openAndroid();
      return;
    }
    setIosDraft(current);
    setIosOpen(true);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [styles.field, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${display || "Select date and time"}`}
      >
        <Ionicons name="calendar-outline" size={18} color={assocColors.muted} />
        <Text style={[styles.fieldText, !display && styles.placeholder]} numberOfLines={1}>
          {display || "Select date and time"}
        </Text>
        {valueIso ? (
          <Pressable
            onPress={() => onChangeIso("")}
            hitSlop={8}
            accessibilityLabel="Clear"
          >
            <Ionicons name="close-circle" size={20} color={assocColors.subtle} />
          </Pressable>
        ) : null}
      </Pressable>

      {Platform.OS === "ios" && iosOpen ? (
        <Modal transparent visible animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIosOpen(false)} />
            <View style={styles.modalSheet}>
              <View style={styles.modalBar}>
                <Pressable onPress={() => setIosOpen(false)} hitSlop={10}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </Pressable>
                <Text style={styles.modalTitle}>{label}</Text>
                <Pressable
                  onPress={() => {
                    onChangeIso(iosDraft.toISOString());
                    setIosOpen(false);
                  }}
                  hitSlop={10}
                >
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                mode="datetime"
                display="spinner"
                value={iosDraft}
                onChange={(_e, d) => {
                  if (d) setIosDraft(d);
                }}
                themeVariant="light"
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: assocColors.text,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: assocColors.bg,
  },
  fieldText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: assocColors.text,
    minWidth: 0,
  },
  placeholder: { color: assocColors.subtle, fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  modalBackdrop: { flex: 1 },
  modalSheet: {
    backgroundColor: assocColors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  modalBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
  },
  modalTitle: { fontSize: 15, fontWeight: "800", color: assocColors.text },
  modalCancel: { fontSize: 16, color: assocColors.muted, fontWeight: "600" },
  modalDone: { fontSize: 16, color: assocColors.accentDark, fontWeight: "800" },
});
