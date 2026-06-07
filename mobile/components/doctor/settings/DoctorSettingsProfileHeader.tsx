import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import {
  DOCTOR_RADIUS,
  doctorCardShadow,
} from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDoctorDisplayName } from "@/lib/doctorHubMappers";

type Props = {
  name: string;
  email: string;
  photo: string | null;
  onChangePhoto: () => void;
};

export function DoctorSettingsProfileHeader({ name, email, photo, onChangePhoto }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);

  const displayName = formatDoctorDisplayName(name);
  const avatarSize = layout.scale(88);
  const ringBorder = 3;
  const ringSize = avatarSize + ringBorder * 2;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: layout.space("xl"),
          paddingBottom: layout.space("lg"),
          paddingHorizontal: layout.space("lg"),
          marginBottom: layout.space("md"),
          borderRadius: DOCTOR_RADIUS.lg,
        },
      ]}
    >
      <View style={[styles.avatarSlot, { width: ringSize, height: ringSize }]}>
        <Pressable
          onPress={onChangePhoto}
          style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          <View
            style={[
              styles.avatarRing,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
                borderWidth: ringBorder,
                borderColor: colors.cardBg,
                backgroundColor: colors.cardBg,
              },
            ]}
          >
            <FeedAvatar
              name={displayName}
              size={avatarSize}
              avatarBase64={photo}
              roleType="doctor"
            />
          </View>
        </Pressable>

        <Pressable
          onPress={onChangePhoto}
          style={[
            styles.cameraBadge,
            {
              backgroundColor: colors.primary,
              borderColor: colors.cardBg,
            },
          ]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          <Ionicons name="camera" size={15} color="#FFFFFF" />
        </Pressable>
      </View>

      <Text
        style={[
          styles.name,
          {
            fontSize: layout.fontSize.title - 2,
            marginTop: layout.space("md"),
          },
        ]}
        numberOfLines={2}
      >
        {displayName}
      </Text>

      <View
        style={[
          styles.rolePill,
          {
            marginTop: layout.space("sm"),
            paddingHorizontal: layout.space("md"),
            borderRadius: 999,
            backgroundColor: colors.primarySoft,
            borderColor: colors.primaryBorder,
          },
        ]}
      >
        <Text style={[styles.roleText, { fontSize: layout.fontSize.footer, color: colors.primary }]}>
          DOCTOR ACCOUNT
        </Text>
      </View>

      {email ? (
        <Text
          style={[
            styles.email,
            {
              fontSize: layout.fontSize.body,
              marginTop: layout.space("sm"),
            },
          ]}
          numberOfLines={1}
        >
          {email}
        </Text>
      ) : null}

      <Pressable
        onPress={onChangePhoto}
        style={({ pressed }) => [
          styles.changePhotoBtn,
          {
            marginTop: layout.space("md"),
            paddingHorizontal: layout.space("md"),
            paddingVertical: layout.space("sm"),
            borderRadius: 999,
            borderColor: colors.primaryBorder,
            backgroundColor: pressed ? colors.primarySoft : colors.background,
          },
        ]}
        accessibilityRole="button"
      >
        <Ionicons name="camera-outline" size={16} color={colors.primary} />
        <Text style={[styles.changePhotoText, { fontSize: layout.fontSize.footer }]}>Change photo</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    wrap: {
      alignItems: "center",
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...doctorCardShadow(colors),
    },
    avatarSlot: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarRing: {
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    cameraBadge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
    },
    name: {
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
      letterSpacing: -0.4,
    },
    rolePill: {
      borderWidth: 1,
      paddingVertical: 4,
    },
    roleText: {
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    email: {
      color: colors.muted,
      fontWeight: "500",
      textAlign: "center",
    },
    changePhotoBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
    },
    changePhotoText: {
      color: colors.primary,
      fontWeight: "700",
    },
  });
}
