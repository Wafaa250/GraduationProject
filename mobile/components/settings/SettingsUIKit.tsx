import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type SettingsGroupProps = {
  title?: string;
  footer?: string;
  children: ReactNode;
};

export function SettingsGroup({ title, footer, children }: SettingsGroupProps) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  return (
    <View style={{ marginBottom: layout.space("lg") }}>
      {title ? (
        <Text
          style={[
            styles.groupTitle,
            {
              fontSize: layout.fontSize.footer,
              marginBottom: layout.space("xs"),
              paddingHorizontal: layout.space("xs"),
            },
          ]}
        >
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.groupCard,
          {
            borderRadius: DOCTOR_RADIUS.lg,
          },
        ]}
      >
        {children}
      </View>
      {footer ? (
        <Text
          style={[
            styles.groupFooter,
            {
              fontSize: layout.fontSize.footer,
              marginTop: layout.space("xs"),
              paddingHorizontal: layout.space("xs"),
            },
          ]}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export function SettingsDivider() {
  const { colors } = useHubTheme();
  const layout = useResponsiveLayout();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginLeft: layout.space("md"),
      }}
    />
  );
}

type SettingsSwitchRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SettingsSwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: SettingsSwitchRowProps) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.row,
        {
          paddingVertical: description ? layout.space("sm") + 2 : layout.space("md"),
          paddingHorizontal: layout.space("md"),
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { fontSize: layout.fontSize.body }]}>{label}</Text>
        {description ? (
          <Text style={[styles.rowDescription, { fontSize: layout.fontSize.footer, marginTop: 2 }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : "#FFFFFF"}
      />
    </View>
  );
}

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SettingsSegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SettingsSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SettingsSegmentedControlProps<T>) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.segmentedWrap,
        {
          margin: layout.space("sm"),
          padding: 3,
          borderRadius: layout.radius.input,
          backgroundColor: colors.background,
        },
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              {
                borderRadius: layout.radius.input - 2,
                paddingVertical: layout.space("sm"),
              },
              active && {
                backgroundColor: colors.cardBg,
                shadowColor: colors.cardShadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2,
                elevation: 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.segmentLabel,
                {
                  fontSize: layout.fontSize.footer,
                  color: active ? colors.foreground : colors.muted,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type SettingsReadOnlyRowProps = {
  label: string;
  value: string;
  hint?: string;
};

export function SettingsReadOnlyRow({ label, value, hint }: SettingsReadOnlyRowProps) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = createStyles(colors);

  return (
    <View style={{ paddingHorizontal: layout.space("md"), paddingVertical: layout.space("md") }}>
      <Text style={[styles.rowLabel, { fontSize: layout.fontSize.body }]}>{label}</Text>
      <Text
        style={[
          styles.readOnlyValue,
          {
            fontSize: layout.fontSize.body,
            marginTop: layout.space("xs"),
          },
        ]}
        numberOfLines={2}
      >
        {value || "—"}
      </Text>
      {hint ? (
        <Text style={[styles.groupFooter, { fontSize: layout.fontSize.footer, marginTop: layout.space("xs") }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    groupTitle: {
      color: colors.muted,
      fontWeight: "700",
      letterSpacing: 0.6,
    },
    groupCard: {
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
    },
    groupFooter: {
      color: colors.muted,
      lineHeight: 18,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowLabel: {
      color: colors.foreground,
      fontWeight: "600",
    },
    rowDescription: {
      color: colors.muted,
      lineHeight: 18,
    },
    readOnlyValue: {
      color: colors.muted,
      fontWeight: "500",
    },
    segmentedWrap: {
      flexDirection: "row",
    },
    segment: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentLabel: {
      fontWeight: "700",
    },
  });
}
