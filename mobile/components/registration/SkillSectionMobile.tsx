import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { CUSTOM_SKILL_MAX_LENGTH } from "@/constants/studentSkillPools";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export type SkillSectionColor = "indigo" | "purple" | "teal";

const COLOR_STYLES: Record<
  SkillSectionColor,
  { activeBg: string; activeBorder: string; activeText: string }
> = {
  indigo: {
    activeBg: "rgba(99, 102, 241, 0.12)",
    activeBorder: "#6366F1",
    activeText: "#6366F1",
  },
  purple: {
    activeBg: "rgba(168, 85, 247, 0.12)",
    activeBorder: "#A855F7",
    activeText: "#A855F7",
  },
  teal: {
    activeBg: "rgba(20, 184, 166, 0.12)",
    activeBorder: "#14B8A6",
    activeText: "#0D9488",
  },
};

type SkillSectionMobileProps = {
  title: string;
  hint: string;
  selectedCount: number;
  options: string[];
  selected: string[];
  customOptions: string[];
  customDraft: string;
  onCustomDraftChange: (value: string) => void;
  onAddCustom: () => void;
  onToggle: (value: string) => void;
  color?: SkillSectionColor;
  required?: boolean;
  error?: string;
};

export function SkillSectionMobile({
  title,
  hint,
  selectedCount,
  options,
  selected,
  customOptions,
  customDraft,
  onCustomDraftChange,
  onAddCustom,
  onToggle,
  color = "indigo",
  required,
  error,
}: SkillSectionMobileProps) {
  const layout = useResponsiveLayout();
  const palette = COLOR_STYLES[color];
  const allOptions = [...options, ...customOptions.filter((c) => !options.includes(c))];

  return (
    <View style={{ marginBottom: layout.space("xl"), width: "100%" }}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { fontSize: layout.fontSize.label }]}>
          {title}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        <View style={[styles.badge, { borderRadius: layout.scale(10) }]}>
          <Text style={[styles.badgeText, { fontSize: layout.scale(11) }]}>{selectedCount} selected</Text>
        </View>
      </View>

      <Text style={[styles.hint, { fontSize: layout.fontSize.footer, marginTop: layout.space("xs"), marginBottom: layout.space("md") }]}>
        {hint}
      </Text>

      <View style={[styles.chipWrap, { gap: layout.space("sm") }]}>
        {allOptions.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <Pressable
              key={option}
              onPress={() => onToggle(option)}
              style={[
                styles.chip,
                {
                  borderRadius: layout.scale(20),
                  paddingHorizontal: layout.space("md"),
                  paddingVertical: layout.space("sm"),
                  minHeight: layout.scale(44),
                },
                isSelected
                  ? {
                      backgroundColor: palette.activeBg,
                      borderColor: palette.activeBorder,
                    }
                  : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              {isSelected ? (
                <Ionicons name="checkmark" size={12} color={palette.activeText} style={styles.checkIcon} />
              ) : null}
              <Text
                style={[
                  styles.chipText,
                  { fontSize: layout.fontSize.footer },
                  isSelected ? { color: palette.activeText, fontWeight: "700" } : null,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: layout.space("md"), width: "100%" }}>
        <Text style={[styles.customHint, { fontSize: layout.scale(11), marginBottom: layout.space("sm") }]}>
          Not listed? Add a custom entry (up to {CUSTOM_SKILL_MAX_LENGTH} characters).
        </Text>
        <View style={[styles.customRow, { gap: layout.space("sm") }]}>
          <TextInput
            value={customDraft}
            onChangeText={onCustomDraftChange}
            placeholder="e.g. specific framework or method"
            placeholderTextColor={AUTH_COLORS.muted}
            maxLength={CUSTOM_SKILL_MAX_LENGTH}
            onSubmitEditing={onAddCustom}
            returnKeyType="done"
            style={[
              styles.customInput,
              {
                flex: 1,
                minHeight: layout.touchTarget,
                borderRadius: layout.radius.input,
                paddingHorizontal: layout.space("md"),
                fontSize: layout.fontSize.body,
              },
            ]}
          />
          <Pressable
            onPress={onAddCustom}
            style={[
              styles.addBtn,
              {
                borderRadius: layout.radius.input,
                minHeight: layout.touchTarget,
                paddingHorizontal: layout.space("lg"),
              },
            ]}
          >
            <Text style={[styles.addBtnText, { fontSize: layout.fontSize.label }]}>Add</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <Text style={[styles.error, { fontSize: layout.scale(12), marginTop: layout.space("sm") }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    fontWeight: "700",
    color: AUTH_COLORS.foreground,
    flexShrink: 1,
  },
  required: {
    color: "#DC2626",
  },
  badge: {
    backgroundColor: AUTH_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: AUTH_COLORS.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: AUTH_COLORS.primary,
    fontWeight: "700",
  },
  hint: {
    color: AUTH_COLORS.muted,
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    maxWidth: "100%",
  },
  checkIcon: {
    marginRight: 4,
  },
  chipText: {
    color: AUTH_COLORS.muted,
    fontWeight: "500",
    flexShrink: 1,
  },
  customHint: {
    color: AUTH_COLORS.muted,
    lineHeight: 16,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  customInput: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.inputBg,
    color: AUTH_COLORS.foreground,
  },
  addBtn: {
    backgroundColor: AUTH_COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.primaryBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    color: AUTH_COLORS.primary,
    fontWeight: "700",
  },
  error: {
    color: "#DC2626",
    fontWeight: "500",
  },
});
