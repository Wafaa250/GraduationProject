import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type OrganizationLogoUploadMobileProps = {
  previewUri: string | null;
  fileName?: string | null;
  onPick: () => void;
  onRemove?: () => void;
  error?: string | null;
};

export function OrganizationLogoUploadMobile({
  previewUri,
  fileName,
  onPick,
  onRemove,
  error,
}: OrganizationLogoUploadMobileProps) {
  const layout = useResponsiveLayout();
  const size = layout.scale(88);

  return (
    <View style={{ width: "100%", marginBottom: layout.space("lg") }}>
      <Text style={[styles.label, { fontSize: layout.fontSize.label, marginBottom: layout.space("sm") }]}>
        Organization logo
      </Text>
      <Pressable
        onPress={onPick}
        style={[
          styles.wrap,
          {
            borderRadius: layout.radius.button,
            padding: layout.space("md"),
          },
          error ? styles.wrapError : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Upload organization logo"
      >
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: layout.radius.input,
            },
          ]}
        >
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={{ width: size, height: size, borderRadius: layout.radius.input }}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="image-outline" size={layout.scale(28)} color={AUTH_COLORS.muted} />
          )}
        </View>
        <View style={styles.meta}>
          <Text style={[styles.title, { fontSize: layout.fontSize.label }]}>
            {previewUri ? "Logo selected" : "Upload logo"}
          </Text>
          <Text style={[styles.hint, { fontSize: layout.fontSize.footer }]}>
            {fileName ?? "PNG, JPG, or WebP — max 5MB. Optional."}
          </Text>
        </View>
        {previewUri && onRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel="Remove logo">
            <Ionicons name="trash-outline" size={layout.iconSize} color={AUTH_COLORS.muted} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={layout.iconSize} color={AUTH_COLORS.muted} />
        )}
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
  wrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: AUTH_COLORS.inputBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
  },
  wrapError: {
    borderColor: "#FCA5A5",
  },
  avatar: {
    backgroundColor: AUTH_COLORS.primarySoft,
    borderWidth: 2,
    borderColor: AUTH_COLORS.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: "600",
    color: AUTH_COLORS.foreground,
  },
  hint: {
    color: AUTH_COLORS.muted,
    lineHeight: 18,
  },
  error: {
    color: "#DC2626",
  },
});
