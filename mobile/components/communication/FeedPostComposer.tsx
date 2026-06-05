import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createStudentPost,
  isStudentPostDocumentFile,
  isStudentPostImageFile,
  type MobilePostFile,
} from "@/api/studentPostsApi";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type PendingAttachment = {
  file: MobilePostFile;
  kind: "image" | "file";
};

type Props = {
  onPosted: () => void;
};

export function FeedPostComposer({ onPosted }: Props) {
  const layout = useResponsiveLayout();
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [posting, setPosting] = useState(false);

  const trimmed = content.trim();
  const canPost = trimmed.length > 0 && !posting;

  const clearAttachment = () => setAttachment(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to attach an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const name = asset.fileName ?? `image-${Date.now()}.jpg`;
    const mimeType = asset.mimeType ?? "image/jpeg";

    if (!isStudentPostImageFile(name, mimeType)) {
      Alert.alert("Invalid image", "Use JPG, JPEG, PNG, or WEBP.");
      return;
    }

    setAttachment({
      kind: "image",
      file: { uri: asset.uri, name, mimeType },
    });
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

    setAttachment({
      kind: "file",
      file: { uri: asset.uri, name, mimeType },
    });
  };

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      await createStudentPost({
        content: trimmed,
        file: attachment?.file,
      });
      setContent("");
      clearAttachment();
      onPosted();
    } catch (err) {
      Alert.alert("Could not publish post", parseApiErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          marginHorizontal: layout.horizontalPadding,
          marginBottom: layout.space("md"),
          borderRadius: layout.radius.button,
          padding: layout.space("md"),
        },
      ]}
    >
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What's on your mind?"
        placeholderTextColor={HUB_COLORS.muted}
        multiline
        style={[styles.input, { fontSize: layout.fontSize.body, minHeight: layout.scale(72) }]}
        editable={!posting}
        textAlignVertical="top"
      />

      {attachment?.kind === "image" ? (
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: attachment.file.uri }}
            style={[styles.previewImage, { borderRadius: layout.radius.input }]}
            contentFit="cover"
          />
          <Pressable onPress={clearAttachment} disabled={posting} style={styles.removeBtn}>
            <Ionicons name="close" size={16} color={HUB_COLORS.foreground} />
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ) : null}

      {attachment?.kind === "file" ? (
        <View style={[styles.filePreview, { borderRadius: layout.radius.input }]}>
          <Ionicons name="document-text-outline" size={22} color={HUB_COLORS.primary} />
          <View style={styles.fileMeta}>
            <Text style={styles.fileName} numberOfLines={1}>
              {attachment.file.name}
            </Text>
            <Text style={styles.fileHint}>PDF or Word document</Text>
          </View>
          <Pressable onPress={clearAttachment} disabled={posting} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={HUB_COLORS.muted} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <View style={styles.tools}>
          <Pressable
            style={styles.toolBtn}
            onPress={() => void pickImage()}
            disabled={posting}
            accessibilityLabel="Add image"
          >
            <Ionicons name="image-outline" size={layout.iconSize} color={HUB_COLORS.primary} />
            <Text style={styles.toolLabel}>Image</Text>
          </Pressable>

          <Pressable
            style={styles.toolBtn}
            onPress={() => void pickFile()}
            disabled={posting}
            accessibilityLabel="Add file"
          >
            <Ionicons name="attach-outline" size={layout.iconSize} color={HUB_COLORS.primary} />
            <Text style={styles.toolLabel}>File</Text>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.postBtn,
            { borderRadius: layout.radius.button, opacity: canPost ? 1 : 0.5 },
          ]}
          onPress={() => void handlePost()}
          disabled={!canPost}
        >
          {posting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HUB_COLORS.cardBg,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
    gap: 12,
    shadowColor: HUB_COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    color: HUB_COLORS.foreground,
    padding: 0,
  },
  previewWrap: {
    gap: 8,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    maxHeight: 220,
    backgroundColor: HUB_COLORS.primarySoft,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  removeText: {
    color: HUB_COLORS.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: HUB_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: HUB_COLORS.border,
  },
  fileMeta: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontWeight: "600",
    color: HUB_COLORS.foreground,
    fontSize: 14,
  },
  fileHint: {
    color: HUB_COLORS.muted,
    fontSize: 12,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  tools: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    minHeight: 36,
  },
  toolLabel: {
    color: HUB_COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  postBtn: {
    backgroundColor: HUB_COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 40,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
