import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type DepartmentChipFieldProps = {
  departments: string[];
  onUpdate: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  error?: string;
};

export function DepartmentChipField({
  departments,
  onUpdate,
  onAdd,
  onRemove,
  error,
}: DepartmentChipFieldProps) {
  const layout = useResponsiveLayout();
  const filledDepartments = departments
    .map((d, index) => ({ label: d.trim(), index }))
    .filter((item) => item.label.length > 0);

  return (
    <View style={{ width: "100%", marginBottom: layout.space("md") }}>
      <Text style={[styles.label, { fontSize: layout.fontSize.label, marginBottom: layout.space("sm") }]}>
        Departments <Text style={styles.required}>*</Text>
      </Text>

      <View style={{ gap: layout.space("sm"), width: "100%" }}>
        {departments.map((dep, index) => (
          <View key={`dep-${index}`} style={[styles.inputRow, { gap: layout.space("sm") }]}>
            <TextInput
              value={dep}
              onChangeText={(v) => onUpdate(index, v)}
              placeholder="e.g. Computer Engineering"
              placeholderTextColor={AUTH_COLORS.muted}
              style={[
                styles.input,
                {
                  flex: 1,
                  minHeight: layout.touchTarget,
                  borderRadius: layout.radius.input,
                  paddingHorizontal: layout.space("md"),
                  fontSize: layout.fontSize.body,
                },
                error ? styles.inputError : null,
              ]}
            />
            {departments.length > 1 ? (
              <Pressable
                onPress={() => onRemove(index)}
                style={[
                  styles.removeBtn,
                  {
                    width: layout.touchTarget,
                    height: layout.touchTarget,
                    borderRadius: layout.radius.input,
                  },
                ]}
                accessibilityLabel="Remove department"
              >
                <Ionicons name="remove" size={20} color={AUTH_COLORS.foreground} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {filledDepartments.length > 0 ? (
        <View style={[styles.chipWrap, { gap: layout.space("sm"), marginTop: layout.space("md") }]}>
          {filledDepartments.map((dep) => (
            <View
              key={`${dep.index}-${dep.label}`}
              style={[
                styles.chip,
                {
                  borderRadius: layout.scale(20),
                  paddingHorizontal: layout.space("md"),
                  paddingVertical: layout.space("sm"),
                  minHeight: layout.scale(40),
                },
              ]}
            >
              <Text style={[styles.chipText, { fontSize: layout.fontSize.footer }]}>{dep.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={onAdd}
        style={[styles.addLink, { marginTop: layout.space("md"), minHeight: layout.scale(44), justifyContent: "center" }]}
      >
        <Text style={[styles.addLinkText, { fontSize: layout.fontSize.footer }]}>+ Add department</Text>
      </Pressable>

      {error ? (
        <Text style={[styles.error, { fontSize: layout.scale(12), marginTop: layout.space("xs") }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "600",
    color: AUTH_COLORS.foreground,
  },
  required: {
    color: "#DC2626",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    color: AUTH_COLORS.foreground,
  },
  inputError: {
    borderColor: "#FCA5A5",
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  chip: {
    backgroundColor: AUTH_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: AUTH_COLORS.primaryBorder,
    justifyContent: "center",
    maxWidth: "100%",
  },
  chipText: {
    color: AUTH_COLORS.primary,
    fontWeight: "600",
    flexShrink: 1,
  },
  addLink: {
    alignSelf: "flex-start",
  },
  addLinkText: {
    color: AUTH_COLORS.primary,
    fontWeight: "700",
  },
  error: {
    color: "#DC2626",
  },
});
