import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const ATTACHMENT_UNAVAILABLE_MESSAGE =
  "Message file uploads are not available in the web app yet. Share links in your message text for now.";

type Props = {
  value: string;
  sending: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

function ComposerIconButton({
  onPress,
  disabled,
  backgroundColor,
  iconName,
  iconColor,
  size,
  accessibilityLabel,
  loading,
}: {
  onPress: () => void;
  disabled?: boolean;
  backgroundColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  size: number;
  accessibilityLabel: string;
  loading?: boolean;
}) {
  const btnSize = size - 4;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        iconButtonStyles.base,
        {
          width: btnSize,
          height: btnSize,
          borderRadius: btnSize / 2,
          backgroundColor,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Ionicons name={iconName} size={20} color={iconColor} />
      )}
    </Pressable>
  );
}

export function DoctorChatComposer({ value, sending, disabled, onChange, onSend }: Props) {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);

  const handleAttach = () => {
    if (disabled || sending) return;

    void DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: false,
      multiple: false,
    })
      .catch(() => undefined)
      .finally(() => {
        Alert.alert("File attachments", ATTACHMENT_UNAVAILABLE_MESSAGE);
      });
  };

  const canSend = !disabled && !sending && value.trim().length > 0;
  const actionSize = layout.scale(40);
  const barMinHeight = layout.scale(48);
  const barRadius = barMinHeight / 2;
  const actionBg = colors.primarySoft;

  return (
    <View
      style={[
        styles.outer,
        {
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: layout.space("sm"),
          paddingBottom: Math.max(insets.bottom, layout.space("sm")),
        },
      ]}
    >
      <View style={[styles.row, { gap: layout.space("sm") }]}>
        <ComposerIconButton
          onPress={handleAttach}
          disabled={disabled || sending}
          backgroundColor={actionBg}
          iconName="attach-outline"
          iconColor={colors.primary}
          size={actionSize}
          accessibilityLabel="Attach file"
        />

        <View
          style={[
            styles.bar,
            {
              minHeight: barMinHeight,
              borderRadius: barRadius,
              paddingLeft: layout.space("md"),
              paddingRight: layout.space("xs") + 2,
              paddingVertical: layout.space("xs") + 2,
              gap: layout.space("sm"),
            },
          ]}
        >
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="Message"
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              {
                fontSize: layout.fontSize.body,
                lineHeight: layout.scale(20),
                maxHeight: layout.scale(112),
                color: colors.foreground,
              },
              Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null,
            ]}
            multiline
            maxLength={4000}
            editable={!disabled && !sending}
            blurOnSubmit={false}
            textAlignVertical="center"
            scrollEnabled
            onSubmitEditing={() => {
              if (canSend) onSend();
            }}
            returnKeyType="send"
          />

          <ComposerIconButton
            onPress={onSend}
            disabled={!canSend}
            backgroundColor={canSend ? colors.primary : actionBg}
            iconName="arrow-up"
            iconColor={canSend ? "#FFFFFF" : colors.muted}
            size={actionSize}
            accessibilityLabel="Send message"
            loading={sending}
          />
        </View>
      </View>
    </View>
  );
}

const iconButtonStyles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    outer: {
      backgroundColor: colors.cardBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    bar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    input: {
      flex: 1,
      paddingTop: Platform.select({ ios: 10, android: 8, default: 10 }),
      paddingBottom: Platform.select({ ios: 10, android: 8, default: 10 }),
      paddingHorizontal: 0,
      margin: 0,
      borderWidth: 0,
      backgroundColor: "transparent",
      ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
    },
  });
}
