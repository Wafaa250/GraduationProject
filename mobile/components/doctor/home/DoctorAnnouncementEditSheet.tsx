import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { FileText, ImagePlus, Paperclip, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  isDoctorPostDocumentFile,
  isDoctorPostImageFile,
  updateDoctorPost,
  type DoctorPost,
  type MobileDoctorPostFile,
} from "@/api/doctorPostsApi";
import { DOCTOR_RADIUS, doctorElevatedShadow } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type PendingAttachment = {
  file: MobileDoctorPostFile;
  kind: "image" | "file";
};

type Props = {
  visible: boolean;
  post: DoctorPost;
  onClose: () => void;
  onSaved: (post: DoctorPost) => void;
};

export function DoctorAnnouncementEditSheet({ visible, post, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  const [content, setContent] = useState(post.content);
  const [newAttachment, setNewAttachment] = useState<PendingAttachment | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [saving, setSaving] = useState(false);

  const existingUrl = post.attachmentUrl ? resolveApiFileUrl(post.attachmentUrl) ?? post.attachmentUrl : null;
  const showExisting = !removeExisting && !newAttachment && !!existingUrl && !!post.attachmentType;
  const trimmed = content.trim();
  const canSave = trimmed.length > 0 && !saving;

  useEffect(() => {
    if (!visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.96);
      return;
    }

    setContent(post.content);
    setNewAttachment(null);
    setRemoveExisting(false);
    setSaving(false);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 24, stiffness: 360, useNativeDriver: true }),
    ]).start();
  }, [visible, post, fadeAnim, scaleAnim]);

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

    setRemoveExisting(false);
    setNewAttachment({ kind: "image", file: { uri: asset.uri, name, mimeType } });
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

    setRemoveExisting(false);
    setNewAttachment({ kind: "file", file: { uri: asset.uri, name, mimeType } });
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await updateDoctorPost(post.id, {
        content: trimmed,
        file: newAttachment?.file,
        removeAttachment: removeExisting && !newAttachment,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      Alert.alert("Could not update post", parseApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close edit post" />
        </Animated.View>

        <Animated.View
          style={[
            styles.dialog,
            {
              marginTop: insets.top + 24,
              marginBottom: insets.bottom + 24,
              maxWidth: layout.width > 520 ? 480 : undefined,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Edit post</Text>
              <Text style={styles.subtitle}>Update your post text or attachment.</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityLabel="Close">
              <X size={18} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.headerDivider} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            <TextInput
              value={content}
              onChangeText={setContent}
              multiline
              scrollEnabled
              editable={!saving}
              placeholderTextColor={colors.muted}
              textAlignVertical="top"
              style={styles.input}
            />

            {showExisting && post.attachmentType === "Image" ? (
              <View style={styles.previewCard}>
                <Image source={{ uri: existingUrl! }} style={styles.previewImage} contentFit="cover" />
                <Pressable
                  onPress={() => setRemoveExisting(true)}
                  disabled={saving}
                  style={styles.previewRemove}
                >
                  <X size={12} color={colors.foreground} strokeWidth={2.5} />
                  <Text style={styles.previewRemoveText}>Remove</Text>
                </Pressable>
              </View>
            ) : null}

            {showExisting && post.attachmentType === "File" ? (
              <View style={styles.filePreview}>
                <View style={styles.fileIconWrap}>
                  <FileText size={18} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {existingUrl?.split("/").pop() ?? "Attachment"}
                  </Text>
                  <Text style={styles.fileHint}>Current file attachment</Text>
                </View>
                <Pressable
                  onPress={() => setRemoveExisting(true)}
                  disabled={saving}
                  hitSlop={8}
                  style={styles.fileRemoveBtn}
                >
                  <X size={16} color={colors.muted} strokeWidth={2.2} />
                </Pressable>
              </View>
            ) : null}

            {newAttachment?.kind === "image" ? (
              <View style={styles.previewCard}>
                <Image source={{ uri: newAttachment.file.uri }} style={styles.previewImage} contentFit="cover" />
                <Pressable
                  onPress={() => setNewAttachment(null)}
                  disabled={saving}
                  style={styles.previewRemove}
                >
                  <X size={12} color={colors.foreground} strokeWidth={2.5} />
                  <Text style={styles.previewRemoveText}>Remove</Text>
                </Pressable>
              </View>
            ) : null}

            {newAttachment?.kind === "file" ? (
              <View style={styles.filePreview}>
                <View style={styles.fileIconWrap}>
                  <FileText size={18} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {newAttachment.file.name}
                  </Text>
                  <Text style={styles.fileHint}>New file attachment</Text>
                </View>
                <Pressable
                  onPress={() => setNewAttachment(null)}
                  disabled={saving}
                  hitSlop={8}
                  style={styles.fileRemoveBtn}
                >
                  <X size={16} color={colors.muted} strokeWidth={2.2} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.tools}>
              <Pressable style={styles.toolBtn} onPress={() => void pickImage()} disabled={saving}>
                <ImagePlus size={16} color={colors.muted} strokeWidth={2.2} />
                <Text style={styles.toolLabel}>Image</Text>
              </Pressable>
              <Pressable style={styles.toolBtn} onPress={() => void pickFile()} disabled={saving}>
                <Paperclip size={16} color={colors.muted} strokeWidth={2.2} />
                <Text style={styles.toolLabel}>File</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.footerDivider} />

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleSave()}
              disabled={!canSave}
              style={({ pressed }) => [
                styles.saveBtn,
                !canSave && styles.saveBtnDisabled,
                pressed && canSave && { opacity: 0.92 },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Save changes</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 23, 42, 0.45)",
    },
    dialog: {
      width: "100%",
      alignSelf: "center",
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
      maxHeight: "88%",
      ...doctorElevatedShadow(colors),
      ...Platform.select({
        ios: {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.16,
          shadowRadius: 32,
        },
        android: { elevation: 16 },
        default: {},
      }),
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.muted,
      marginTop: 4,
      lineHeight: 18,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    headerDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    body: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
    },
    input: {
      minHeight: 112,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      lineHeight: 22,
      color: colors.foreground,
    },
    previewCard: {
      borderRadius: DOCTOR_RADIUS.sm,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    previewImage: {
      width: "100%",
      height: 160,
      backgroundColor: colors.border,
    },
    previewRemove: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 8,
      backgroundColor: colors.background,
    },
    previewRemoveText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.foreground,
    },
    filePreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    fileIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
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
    fileHint: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    fileRemoveBtn: {
      padding: 4,
    },
    tools: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    toolBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      minHeight: 40,
      borderRadius: 8,
    },
    toolLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
    },
    footerDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    cancelBtn: {
      minHeight: 40,
      paddingHorizontal: 16,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
    },
    saveBtn: {
      minHeight: 40,
      paddingHorizontal: 16,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 120,
    },
    saveBtnDisabled: {
      opacity: 0.45,
    },
    saveText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
