import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Trash2, Upload } from "lucide-react-native";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import { uploadAssociationLogo } from "@/api/associationApi";
import { AssociationAvatar } from "@/components/association/AssociationAvatar";
import { ASSOC_COLORS } from "@/constants/associationTheme";

type Props = {
  organizationName: string;
  logoUrl: string | null;
  onLogoUrlChange: (url: string | null) => void;
  disabled?: boolean;
};

export function AssociationLogoUpload({
  organizationName,
  logoUrl,
  onLogoUrlChange,
  disabled = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const displayUrl = logoUrl
    ? logoUrl.startsWith("file:") || logoUrl.startsWith("http")
      ? logoUrl
      : resolveApiFileUrl(logoUrl) ?? logoUrl
    : null;

  const pickLogo = async () => {
    if (disabled || uploading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const url = await uploadAssociationLogo({
        uri: asset.uri,
        name: asset.fileName ?? `logo-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      onLogoUrlChange(url);
    } catch (err) {
      Alert.alert("Upload failed", parseApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.previewRow}>
        {displayUrl ? (
          <Image source={{ uri: displayUrl }} style={styles.previewImage} />
        ) : (
          <AssociationAvatar name={organizationName} logoUrl={null} size="md" />
        )}
        <View style={{ flex: 1, gap: 8 }}>
          <Pressable
            onPress={() => void pickLogo()}
            disabled={disabled || uploading}
            style={[styles.uploadBtn, (disabled || uploading) && styles.uploadBtnDisabled]}
          >
            <Upload size={14} color="#FFFFFF" strokeWidth={2.25} />
            <Text style={styles.uploadBtnText}>
              {uploading ? "Uploading…" : displayUrl ? "Change logo" : "Upload logo"}
            </Text>
          </Pressable>
          {displayUrl && !disabled && !uploading ? (
            <Pressable onPress={() => onLogoUrlChange(null)} style={styles.removeBtn}>
              <Trash2 size={13} color="#B91C1C" strokeWidth={2.25} />
              <Text style={styles.removeText}>Remove logo</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ASSOC_COLORS.accentBorder,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ASSOC_COLORS.accent,
  },
  uploadBtnDisabled: {
    opacity: 0.6,
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  removeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C",
  },
});
