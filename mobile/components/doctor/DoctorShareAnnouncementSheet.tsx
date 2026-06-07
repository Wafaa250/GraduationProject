import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { FileText, ImagePlus, Paperclip, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  createDoctorPost,
  isDoctorPostDocumentFile,
  isDoctorPostImageFile,
  type MobileDoctorPostFile,
} from "@/api/doctorPostsApi";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

type PendingAttachment = {
  file: MobileDoctorPostFile;
  kind: "image" | "file";
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onPublished: () => void;
};

const INPUT_HEIGHT = 84;

export function DoctorShareAnnouncementSheet({ visible, onClose, onPublished }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [posting, setPosting] = useState(false);
  const slideAnim = useRef(new Animated.Value(360)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const trimmed = content.trim();
  const canPost = trimmed.length > 0 && !posting;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(360);
      fadeAnim.setValue(0);
      setContent("");
      setAttachment(null);
      setPosting(false);
      return;
    }

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 24,
        stiffness: 260,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, slideAnim, fadeAnim]);

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

    if (!isDoctorPostImageFile(name, mimeType)) {
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

    if (!isDoctorPostDocumentFile(name, mimeType)) {
      Alert.alert("Invalid file", "Use PDF or DOCX.");
      return;
    }

    setAttachment({ kind: "file", file: { uri: asset.uri, name, mimeType } });
  };

  const handlePublish = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      await createDoctorPost({
        content: trimmed,
        file: attachment?.file,
      });
      onClose();
      Alert.alert(
        "Update published",
        "Your announcement is now visible in the Communication Hub feed.",
      );
      onPublished();
    } catch (err) {
      Alert.alert("Could not publish update", parseApiErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close composer" />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 10),
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Share Update</Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton} accessibilityLabel="Close">
                <X size={16} color={colors.muted} strokeWidth={2.2} />
              </Pressable>
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Share news, guidance, or announcements…"
                placeholderTextColor={colors.muted}
                multiline
                scrollEnabled
                style={styles.input}
                editable={!posting}
                textAlignVertical="top"
                autoFocus
              />
            </View>

            {attachment?.kind === "image" ? (
              <View style={styles.attachmentRow}>
                <Image source={{ uri: attachment.file.uri }} style={styles.thumbImage} contentFit="cover" />
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.file.name}
                </Text>
                <Pressable onPress={() => setAttachment(null)} disabled={posting} hitSlop={8} style={styles.removeChip}>
                  <X size={14} color={colors.muted} strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : null}

            {attachment?.kind === "file" ? (
              <View style={styles.attachmentRow}>
                <View style={styles.fileIconWrap}>
                  <FileText size={16} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {attachment.file.name}
                  </Text>
                  <Text style={styles.fileHint}>PDF or Word</Text>
                </View>
                <Pressable onPress={() => setAttachment(null)} disabled={posting} hitSlop={8} style={styles.removeChip}>
                  <X size={14} color={colors.muted} strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.actionBar}>
              <View style={styles.toolbar}>
                <Pressable style={styles.toolBtn} onPress={() => void pickImage()} disabled={posting}>
                  <ImagePlus size={17} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.toolLabel}>Image</Text>
                </Pressable>
                <Pressable style={styles.toolBtn} onPress={() => void pickFile()} disabled={posting}>
                  <Paperclip size={17} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.toolLabel}>File</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => void handlePublish()}
                disabled={!canPost}
                style={[styles.publishBtn, { opacity: canPost ? 1 : 0.45 }]}
              >
                {posting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.publishText}>Publish</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 23, 42, 0.45)",
    },
    keyboardWrap: {
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: 0,
      borderColor: colors.border,
      paddingTop: 6,
    },
    handle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingBottom: 8,
      gap: 8,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.2,
    },
    closeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    inputWrap: {
      marginHorizontal: 14,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    input: {
      height: INPUT_HEIGHT,
      fontSize: 15,
      lineHeight: 21,
      color: colors.foreground,
      padding: 0,
    },
    attachmentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 14,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    thumbImage: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    attachmentName: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
      color: colors.foreground,
    },
    fileIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.cardBg,
      alignItems: "center",
      justifyContent: "center",
    },
    fileMeta: {
      flex: 1,
      minWidth: 0,
    },
    fileName: {
      fontWeight: "700",
      color: colors.foreground,
      fontSize: 12,
    },
    fileHint: {
      color: colors.muted,
      fontSize: 10,
      marginTop: 1,
    },
    removeChip: {
      padding: 4,
    },
    actionBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      paddingHorizontal: 14,
      paddingTop: 10,
      marginTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flex: 1,
    },
    toolBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 10,
      minHeight: 40,
      borderRadius: 8,
    },
    toolLabel: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 13,
    },
    publishBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      minHeight: 40,
      minWidth: 96,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    publishText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 14,
    },
  });
