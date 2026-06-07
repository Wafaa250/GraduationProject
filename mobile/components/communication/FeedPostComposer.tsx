import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { getMe } from "@/api/meApi";
import {
  createStudentPost,
  isStudentPostDocumentFile,
  isStudentPostImageFile,
  type MobilePostFile,
} from "@/api/studentPostsApi";
import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { FeedEmojiPicker } from "@/components/communication/FeedEmojiPicker";
import { HubCard } from "@/components/hub/HubCard";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubDesign } from "@/hooks/use-hub-design";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";

type PendingAttachment = {
  file: MobilePostFile;
  kind: "image" | "file";
};

type Props = {
  onPosted: () => void;
};

export function FeedPostComposer({ onPosted }: Props) {
  const hub = useHubDesign();
  const { colors } = hub;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [posting, setPosting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [displayName, setDisplayName] = useState("You");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  useEffect(() => {
    void getMe()
      .then((me) => {
        setDisplayName(me.name?.trim() || "You");
        setAvatarBase64(me.profilePictureBase64 ?? null);
      })
      .catch(() => undefined);
  }, []);

  const trimmed = content.trim();
  const canPost = trimmed.length > 0 && !posting;

  const clearAttachment = () => setAttachment(null);

  const insertEmoji = (emoji: string) => {
    const { start, end } = selectionRef.current;
    setContent((prev) => `${prev.slice(0, start)}${emoji}${prev.slice(end)}`);
    const nextPos = start + emoji.length;
    selectionRef.current = { start: nextPos, end: nextPos };
    inputRef.current?.focus();
  };

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

    setAttachment({ kind: "image", file: { uri: asset.uri, name, mimeType } });
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
  };

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      await createStudentPost({ content: trimmed, file: attachment?.file });
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
    <HubCard>
      <Pressable style={styles.composerTop} onPress={() => inputRef.current?.focus()}>
        <FeedAvatar
          name={displayName}
          size={hub.avatar.composer}
          avatarBase64={profilePhotoUrl(avatarBase64) ? avatarBase64 : null}
          roleType="student"
        />
        <View style={[styles.inputShell, { borderRadius: hub.radius.md }]}>
          <TextInput
            ref={inputRef}
            value={content}
            onChangeText={setContent}
            onSelectionChange={(event) => {
              selectionRef.current = event.nativeEvent.selection;
            }}
            placeholder="Share an update..."
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.input, hub.type.body]}
            editable={!posting}
            textAlignVertical="top"
          />
        </View>
      </Pressable>

      {attachment?.kind === "image" ? (
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: attachment.file.uri }}
            style={[styles.previewImage, { borderRadius: hub.radius.md }]}
            contentFit="cover"
          />
          <Pressable onPress={clearAttachment} disabled={posting} style={styles.removeBtn}>
            <Ionicons name="close-circle" size={22} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      {attachment?.kind === "file" ? (
        <View style={[styles.filePreview, { borderRadius: hub.radius.md }]}>
          <View style={styles.fileIconWrap}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.fileMeta}>
            <Text style={styles.fileName} numberOfLines={1}>
              {attachment.file.name}
            </Text>
          </View>
          <Pressable onPress={clearAttachment} disabled={posting} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.toolbar}>
        <View style={styles.tools}>
          <Pressable
            style={[styles.toolBtn, emojiOpen && styles.toolBtnActive]}
            onPress={() => setEmojiOpen((open) => !open)}
            disabled={posting}
            accessibilityLabel="Add emoji"
          >
            <Ionicons name="happy-outline" size={hub.icon.lg} color={colors.muted} />
          </Pressable>
          <Pressable
            style={styles.toolBtn}
            onPress={() => void pickImage()}
            disabled={posting}
            accessibilityLabel="Add image"
          >
            <Ionicons name="image-outline" size={hub.icon.lg} color={colors.muted} />
          </Pressable>
          <Pressable
            style={styles.toolBtn}
            onPress={() => void pickFile()}
            disabled={posting}
            accessibilityLabel="Add file"
          >
            <Ionicons name="attach-outline" size={hub.icon.lg} color={colors.muted} />
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.postBtn,
            { borderRadius: hub.radius.button, opacity: canPost ? 1 : 0.45 },
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

      <FeedEmojiPicker
        visible={emojiOpen}
        onClose={() => setEmojiOpen(false)}
        onSelect={insertEmoji}
        colors={colors}
      />
    </HubCard>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    composerTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    inputShell: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 72,
    },
    input: {
      color: colors.foreground,
      padding: 0,
      minHeight: 52,
    },
    previewWrap: {
      position: "relative",
    },
    previewImage: {
      width: "100%",
      aspectRatio: 16 / 9,
      maxHeight: 200,
      backgroundColor: colors.primarySoft,
    },
    removeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: colors.cardBg,
      borderRadius: 999,
    },
    filePreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
    },
    fileIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    fileMeta: { flex: 1 },
    fileName: {
      fontWeight: "600",
      color: colors.foreground,
      fontSize: 14,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    tools: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    toolBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    toolBtnActive: {
      backgroundColor: colors.primarySoft,
    },
    postBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      height: 36,
      minWidth: 72,
      alignItems: "center",
      justifyContent: "center",
    },
    postBtnText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },
  });
