import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { resolveApiFileUrl, parseApiErrorMessage } from "@/api/axiosInstance";
import {
  isStudentPostDocumentFile,
  isStudentPostImageFile,
  updateStudentPost,
  type MobilePostFile,
  type StudentPost,
} from "@/api/studentPostsApi";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { FeedItem } from "@/lib/feedTypes";

type PendingAttachment = {
  file: MobilePostFile;
  kind: "image" | "file";
};

type Props = {
  item: FeedItem;
  visible: boolean;
  onClose: () => void;
  onSaved: (post: StudentPost) => void;
};

export function FeedSocialPostEditSheet({ item, visible, onClose, onSaved }: Props) {
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [content, setContent] = useState(item.description);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setContent(item.description);
    setAttachment(null);
    setRemoveExisting(false);
  }, [visible, item]);

  const existingUrl = item.attachmentUrl ?? item.imageUrl ?? null;
  const existingResolved = existingUrl ? resolveApiFileUrl(existingUrl) ?? existingUrl : null;
  const showExisting =
    !removeExisting && !attachment && existingResolved && item.attachmentType;

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to attach an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const name = asset.fileName ?? `image-${Date.now()}.jpg`;
    const mimeType = asset.mimeType ?? "image/jpeg";
    if (!isStudentPostImageFile(name, mimeType)) {
      Alert.alert("Invalid image", "Use JPG, JPEG, PNG, or WEBP.");
      return;
    }
    setAttachment({ kind: "image", file: { uri: asset.uri, name, mimeType } });
    setRemoveExisting(false);
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const name = asset.name ?? `file-${Date.now()}`;
    const mimeType = asset.mimeType ?? "application/octet-stream";
    if (!isStudentPostDocumentFile(name, mimeType)) {
      Alert.alert("Invalid file", "Use PDF or DOCX.");
      return;
    }
    setAttachment({ kind: "file", file: { uri: asset.uri, name, mimeType } });
    setRemoveExisting(false);
  };

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      Alert.alert("Content required", "Post content cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const post = await updateStudentPost(item.relatedEntityId, {
        content: trimmed,
        file: attachment?.file,
        removeAttachment: removeExisting,
      });
      onSaved(post);
      onClose();
    } catch (err) {
      Alert.alert("Could not update post", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { padding: layout.space("md") }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit post</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <TextInput
          value={content}
          onChangeText={setContent}
          multiline
          style={[styles.input, { minHeight: layout.scale(100) }]}
          editable={!saving}
          textAlignVertical="top"
        />

        {showExisting && item.attachmentType === "Image" ? (
          <Image source={{ uri: existingResolved! }} style={styles.previewImage} contentFit="cover" />
        ) : null}

        {showExisting && item.attachmentType === "File" ? (
          <View style={styles.filePreview}>
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            <Text style={styles.fileName} numberOfLines={1}>
              Existing attachment
            </Text>
            <Pressable onPress={() => setRemoveExisting(true)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ) : null}

        {attachment?.kind === "image" ? (
          <Image source={{ uri: attachment.file.uri }} style={styles.previewImage} contentFit="cover" />
        ) : null}

        {attachment?.kind === "file" ? (
          <View style={styles.filePreview}>
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            <Text style={styles.fileName} numberOfLines={1}>
              {attachment.file.name}
            </Text>
            <Pressable onPress={() => setAttachment(null)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.tools}>
          <Pressable style={styles.toolBtn} onPress={() => void pickImage()} disabled={saving}>
            <Ionicons name="image-outline" size={20} color={colors.primary} />
            <Text style={styles.toolLabel}>Image</Text>
          </Pressable>
          <Pressable style={styles.toolBtn} onPress={() => void pickFile()} disabled={saving}>
            <Ionicons name="attach-outline" size={20} color={colors.primary} />
            <Text style={styles.toolLabel}>File</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save changes</Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, gap: 12 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      color: colors.foreground,
      backgroundColor: colors.inputBg,
    },
    previewImage: { width: "100%", height: 180, borderRadius: 10, backgroundColor: colors.primarySoft },
    filePreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
    },
    fileName: { flex: 1, color: colors.foreground, fontWeight: "600" },
    removeText: { color: colors.primary, fontWeight: "600" },
    tools: { flexDirection: "row", gap: 16 },
    toolBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    toolLabel: { color: colors.primary, fontWeight: "600" },
    saveBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 8,
    },
    saveBtnText: { color: "#fff", fontWeight: "700" },
  });
