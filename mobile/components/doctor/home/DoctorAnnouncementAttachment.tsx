import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { resolveApiFileUrl } from "@/api/axiosInstance";
import type { DoctorPost } from "@/api/doctorPostsApi";
import { HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { DOCTOR_RADIUS } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

function attachmentFileName(url: string): string {
  try {
    const parts = url.split("/").filter(Boolean);
    const raw = parts[parts.length - 1] ?? "Attachment";
    return decodeURIComponent(raw.split("?")[0] ?? raw);
  } catch {
    return "Attachment";
  }
}

type Props = {
  post: DoctorPost;
};

export function DoctorAnnouncementAttachment({ post }: Props) {
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);

  const attachmentUrl = post.attachmentUrl?.trim();
  if (!attachmentUrl || !post.attachmentType) return null;

  const resolved = resolveApiFileUrl(attachmentUrl) ?? attachmentUrl;

  const openFile = async () => {
    try {
      await Linking.openURL(resolved);
    } catch {
      Alert.alert("Unable to open file", "This attachment could not be opened on your device.");
    }
  };

  if (post.attachmentType === "Image") {
    return (
      <View style={styles.imageWrap}>
        <Image source={{ uri: resolved }} style={styles.image} contentFit="cover" accessibilityLabel="Announcement image" />
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => void openFile()}
      style={({ pressed }) => [styles.fileCard, pressed && { opacity: 0.88 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open attachment ${attachmentFileName(resolved)}`}
    >
      <Ionicons name="document-text-outline" size={20} color={colors.primary} />
      <View style={styles.fileMeta}>
        <Text style={styles.fileName} numberOfLines={1}>
          {attachmentFileName(resolved)}
        </Text>
        <Text style={styles.fileAction}>Download file</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    imageWrap: {
      marginTop: HOME_SPACE.sm,
      borderRadius: DOCTOR_RADIUS.sm,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.primarySoft,
    },
    image: {
      width: "100%",
      aspectRatio: 16 / 9,
      maxHeight: 220,
      backgroundColor: colors.border,
    },
    fileCard: {
      marginTop: HOME_SPACE.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    fileMeta: {
      flex: 1,
      minWidth: 0,
    },
    fileName: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },
    fileAction: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
      marginTop: 2,
    },
  });
