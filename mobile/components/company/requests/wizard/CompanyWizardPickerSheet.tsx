import { Check, Search, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS, companyElevatedShadow } from "@/components/company/ui/companyDesignSystem";
import type { CompanyColorScheme } from "@/constants/companyTheme";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { normalizeCustomEntry } from "@/lib/companyRequestCatalog";

const SEARCH_THRESHOLD = 6;

export type WizardPickerOption = {
  value: string;
  label: string;
};

type SingleSelectProps = {
  mode: "single";
  value: string;
  onSelect: (value: string) => void;
};

type MultiSelectProps = {
  mode: "multi";
  value: string[];
  onApply: (values: string[]) => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: WizardPickerOption[];
  searchPlaceholder?: string;
  allowCustom?: boolean;
} & (SingleSelectProps | MultiSelectProps);

export function normalizeWizardPickerOptions(options: string[] | WizardPickerOption[]): WizardPickerOption[] {
  if (options.length === 0) return [];
  if (typeof options[0] === "string") {
    return (options as string[]).map((o) => ({ value: o, label: o }));
  }
  return options as WizardPickerOption[];
}

export function CompanyWizardPickerSheet(props: Props) {
  const {
    visible,
    onClose,
    title,
    options,
    searchPlaceholder = "Search…",
    allowCustom = false,
    mode,
  } = props;

  const colors = useCompanyTheme();
  const styles = useMemo(() => createSheetStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>([]);
  const slideAnim = useRef(new Animated.Value(520)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showSearch = options.length > SEARCH_THRESHOLD || allowCustom;

  const multiValue = mode === "multi" ? props.value : null;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(520);
      fadeAnim.setValue(0);
      setQuery("");
      return;
    }

    if (mode === "multi" && multiValue) {
      setDraft([...multiValue]);
    }

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 26,
        stiffness: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, mode, multiValue, slideAnim, fadeAnim]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const customCandidate = allowCustom ? normalizeCustomEntry(query) : null;
  const showCustom =
    allowCustom &&
    customCandidate &&
    !options.some((o) => o.label.toLowerCase() === customCandidate.toLowerCase());

  const isSelected = (optionValue: string) => {
    if (mode === "single") {
      return props.value === optionValue;
    }
    return draft.some((v) => v.toLowerCase() === optionValue.toLowerCase());
  };

  const handleSelectSingle = (optionValue: string) => {
    if (mode !== "single") return;
    props.onSelect(optionValue);
    onClose();
  };

  const toggleMulti = (optionValue: string, label: string) => {
    if (mode !== "multi") return;
    const exists = draft.some((v) => v.toLowerCase() === optionValue.toLowerCase());
    if (exists) {
      setDraft((prev) => prev.filter((v) => v.toLowerCase() !== optionValue.toLowerCase()));
    } else {
      setDraft((prev) => [...prev, label]);
    }
  };

  const handleCustom = () => {
    if (!customCandidate) return;
    if (mode === "single") {
      props.onSelect(customCandidate);
      onClose();
      return;
    }
    if (!draft.some((v) => v.toLowerCase() === customCandidate.toLowerCase())) {
      setDraft((prev) => [...prev, customCandidate]);
    }
    setQuery("");
  };

  const selectedCount = mode === "multi" ? draft.length : props.value ? 1 : 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close picker" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, HOME_SPACE.lg),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {mode === "multi" ? (
                <Text style={styles.subtitle}>
                  {selectedCount === 0 ? "No options selected" : `${selectedCount} selected`}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
            >
              <X size={18} color={colors.foreground} strokeWidth={2.4} />
            </Pressable>
          </View>

          {showSearch ? (
            <View style={styles.searchWrap}>
              <View style={styles.searchField}>
                <Search size={17} color={colors.muted} strokeWidth={2.2} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.muted}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {query.length > 0 ? (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <X size={16} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          {showCustom ? (
            <Pressable onPress={handleCustom} style={({ pressed }) => [styles.customRow, pressed && { opacity: 0.92 }]}>
              <Text style={styles.customLabel}>
                {mode === "single" ? `Create "${customCandidate}"` : `Add "${customCandidate}"`}
              </Text>
            </Pressable>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No matches found.</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const selected = isSelected(item.value);
              const isLast = index === filtered.length - 1;
              return (
                <Pressable
                  onPress={() =>
                    mode === "single" ? handleSelectSingle(item.value) : toggleMulti(item.value, item.label)
                  }
                  style={({ pressed }) => [
                    styles.optionRow,
                    selected && styles.optionRowSelected,
                    pressed && !selected && { backgroundColor: colors.surfaceMuted },
                    isLast && styles.optionRowLast,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]} numberOfLines={2}>
                    {item.label}
                  </Text>
                  <View style={[styles.indicator, selected && styles.indicatorSelected]}>
                    {selected ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            }}
          />

          {mode === "multi" ? (
            <View style={styles.footer}>
              <Pressable
                onPress={() => setDraft([])}
                disabled={draft.length === 0}
                style={({ pressed }) => [
                  styles.footerBtnOutline,
                  draft.length === 0 && styles.footerBtnDisabled,
                  pressed && draft.length > 0 && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.footerBtnOutlineText}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  props.onApply(draft);
                  onClose();
                }}
                style={({ pressed }) => [styles.footerBtnPrimary, pressed && { opacity: 0.92 }]}
              >
                <Text style={styles.footerBtnPrimaryText}>
                  Apply{draft.length > 0 ? ` (${draft.length})` : ""}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const createSheetStyles = (colors: CompanyColorScheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      maxHeight: "88%",
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: COMPANY_RADIUS.xl,
      borderTopRightRadius: COMPANY_RADIUS.xl,
      ...companyElevatedShadow(colors),
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        },
        android: { elevation: 16 },
        default: {},
      }),
    },
    handleWrap: {
      alignItems: "center",
      paddingTop: HOME_SPACE.sm,
      paddingBottom: HOME_SPACE.xs,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: COMPANY_RADIUS.pill,
      backgroundColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: HOME_SPACE.lg,
      paddingBottom: HOME_SPACE.md,
      gap: HOME_SPACE.md,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      marginTop: 4,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    searchWrap: {
      paddingHorizontal: HOME_SPACE.lg,
      paddingBottom: HOME_SPACE.md,
    },
    searchField: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: COMPANY_RADIUS.md,
      paddingHorizontal: HOME_SPACE.md,
      backgroundColor: colors.surfaceMuted,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.foreground,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
    },
    customRow: {
      marginHorizontal: HOME_SPACE.lg,
      marginBottom: HOME_SPACE.sm,
      paddingVertical: HOME_SPACE.md,
      paddingHorizontal: HOME_SPACE.md,
      borderRadius: COMPANY_RADIUS.md,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    customLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.accent,
    },
    list: {
      flexGrow: 0,
      maxHeight: 420,
    },
    listContent: {
      paddingHorizontal: HOME_SPACE.lg,
      paddingBottom: HOME_SPACE.sm,
    },
    emptyWrap: {
      paddingVertical: HOME_SPACE.xxl,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      fontWeight: "500",
    },
    optionRow: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: HOME_SPACE.md,
      paddingVertical: HOME_SPACE.md,
      paddingHorizontal: HOME_SPACE.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      borderRadius: COMPANY_RADIUS.sm,
    },
    optionRowSelected: {
      backgroundColor: colors.accentSoft,
      borderBottomColor: "transparent",
      marginBottom: 2,
    },
    optionRowLast: {
      borderBottomWidth: 0,
    },
    optionLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: colors.foreground,
      lineHeight: 22,
    },
    optionLabelSelected: {
      fontWeight: "700",
      color: colors.accent,
    },
    indicator: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardBg,
    },
    indicatorSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    footer: {
      flexDirection: "row",
      gap: HOME_SPACE.sm,
      paddingHorizontal: HOME_SPACE.lg,
      paddingTop: HOME_SPACE.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    footerBtnOutline: {
      flex: 1,
      minHeight: 48,
      borderRadius: COMPANY_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardBg,
    },
    footerBtnOutlineText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
    },
    footerBtnPrimary: {
      flex: 1.4,
      minHeight: 48,
      borderRadius: COMPANY_RADIUS.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
    },
    footerBtnPrimaryText: {
      fontSize: 15,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    footerBtnDisabled: {
      opacity: 0.45,
    },
  });
