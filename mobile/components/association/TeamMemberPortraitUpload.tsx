import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Camera, Trash2, Upload, UserRound } from "lucide-react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import { uploadOrganizationTeamMemberImage } from "@/api/organizationTeamMembersApi";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  imageUrl: string | null;
  onImageUrlChange: (url: string | null) => void;
  onDisplayUrlChange?: (url: string | null) => void;
  disabled?: boolean;
};

function resolveDisplayUrl(imageUrl: string | null, localPreview: string | null): string | null {
  if (localPreview) return localPreview;
  if (!imageUrl?.trim()) return null;
  if (imageUrl.startsWith("file:") || imageUrl.startsWith("http")) return imageUrl;
  return resolveApiFileUrl(imageUrl) ?? imageUrl;
}

export function TeamMemberPortraitUpload({
  imageUrl,
  onImageUrlChange,
  onDisplayUrlChange,
  disabled = false,
}: Props) {
  const layout = useResponsiveLayout();
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = resolveDisplayUrl(imageUrl, localPreview);

  useEffect(() => {
    onDisplayUrlChange?.(displayUrl);
  }, [displayUrl, onDisplayUrlChange]);

  const pickAndUpload = async () => {
    if (disabled || uploading) return;
    setError(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    setLocalPreview(asset.uri);
    setUploading(true);
    try {
      const url = await uploadOrganizationTeamMemberImage({
        uri: asset.uri,
        name: asset.fileName ?? `portrait-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      onImageUrlChange(url);
      setLocalPreview(null);
    } catch (err) {
      setLocalPreview(null);
      setError(parseApiErrorMessage(err));
      Alert.alert("Upload failed", parseApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setLocalPreview(null);
    setError(null);
    onImageUrlChange(null);
  };

  const canInteract = !disabled && !uploading;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => void pickAndUpload()}
        disabled={!canInteract}
        style={[styles.drop, { borderRadius: layout.radius.button, padding: layout.space("md") }]}
      >
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            {displayUrl ? (
              <Image source={{ uri: displayUrl }} style={styles.avatar} />
            ) : uploading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator color={ASSOC_COLORS.accent} />
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserRound size={32} color={ASSOC_COLORS.muted} strokeWidth={1.5} />
              </View>
            )}
            {canInteract ? (
              <View style={styles.badge}>
                <Camera size={14} color="#FFFFFF" strokeWidth={2.25} />
              </View>
            ) : null}
          </View>

          {canInteract ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                void pickAndUpload();
              }}
              style={styles.uploadBtn}
            >
              <Upload size={14} color="#FFFFFF" strokeWidth={2.25} />
              <Text style={styles.uploadBtnText}>{displayUrl ? "Change photo" : "Upload photo"}</Text>
            </Pressable>
          ) : null}

          {uploading ? <Text style={styles.helperUploading}>Uploading…</Text> : null}
        </View>
      </Pressable>

      {displayUrl && !uploading && !disabled ? (
        <Pressable onPress={clearImage} style={styles.removeBtn}>
          <Trash2 size={13} color="#B91C1C" strokeWidth={2.25} />
          <Text style={styles.removeText}>Remove photo</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  drop: {
    width: "100%",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: ASSOC_COLORS.border,
    backgroundColor: ASSOC_COLORS.background,
  },
  hero: {
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: ASSOC_COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ASSOC_COLORS.accent,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ASSOC_COLORS.accent,
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  helperUploading: {
    fontSize: 12,
    fontWeight: "600",
    color: ASSOC_COLORS.accentDark,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  removeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C",
  },
  error: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B91C1C",
    textAlign: "center",
  },
});
