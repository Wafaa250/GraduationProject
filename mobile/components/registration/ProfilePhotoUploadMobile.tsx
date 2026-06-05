import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type ProfilePhotoUploadMobileProps = {
  previewUri: string | null;
  onPick: () => void;
};

export function ProfilePhotoUploadMobile({ previewUri, onPick }: ProfilePhotoUploadMobileProps) {
  const layout = useResponsiveLayout();
  const size = layout.scale(88);

  return (
    <Pressable
      onPress={onPick}
      style={[
        styles.wrap,
        {
          borderRadius: layout.radius.button,
          padding: layout.space("md"),
          marginBottom: layout.space("lg"),
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Upload profile photo"
    >
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
        ) : (
          <Ionicons name="camera-outline" size={layout.scale(28)} color={AUTH_COLORS.muted} />
        )}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.label, { fontSize: layout.fontSize.label }]}>Profile photo</Text>
        <Text style={[styles.hint, { fontSize: layout.fontSize.footer }]}>
          {previewUri ? "Tap to change photo" : "Optional — tap to add a photo"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={layout.iconSize} color={AUTH_COLORS.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: AUTH_COLORS.inputBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
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
  label: {
    fontWeight: "600",
    color: AUTH_COLORS.foreground,
  },
  hint: {
    color: AUTH_COLORS.muted,
  },
});
