import * as DocumentPicker from "expo-document-picker";
import { FileUp, Upload, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { importStudentsToSection } from "@/api/doctorCoursesApi";
import {
  pickWebRosterFile,
  type MobileUploadFile,
} from "@/api/mobileUpload";
import { DOCTOR_RADIUS, DOCTOR_SPACE } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { importResultSummary, isAcceptedRosterFile } from "@/lib/doctorCourseUi";

type Props = {
  visible: boolean;
  sectionId: number;
  onClose: () => void;
  onSaved: (summary: string) => void;
  onUseManualAdd: () => void;
};

export function ImportStudentsSheet({ visible, sectionId, onClose, onSaved, onUseManualAdd }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useHubTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [file, setFile] = useState<MobileUploadFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      return;
    }

    setFile(null);
    setError(null);
    setUploading(false);

    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 24, stiffness: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, slideAnim, fadeAnim]);

  const pickFile = useCallback(async (): Promise<MobileUploadFile | null> => {
    try {
      if (Platform.OS === "web") {
        const picked = await pickWebRosterFile();
        if (!picked) return null;

        if (!isAcceptedRosterFile(picked.name)) {
          setError("Use CSV, Excel (.xlsx), Word (.docx), or PDF.");
          setFile(null);
          return null;
        }

        setError(null);
        setFile(picked);
        return picked;
      }

      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/pdf",
        ],
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];
      const name = asset.name ?? "roster";
      if (!isAcceptedRosterFile(name)) {
        setError("Use CSV, Excel (.xlsx), Word (.docx), or PDF.");
        setFile(null);
        return null;
      }

      const webFile = "file" in asset ? (asset.file as File | undefined) : undefined;
      const picked: MobileUploadFile = {
        uri: asset.uri,
        name,
        mimeType: asset.mimeType ?? "application/octet-stream",
        webFile,
      };

      setError(null);
      setFile(picked);
      return picked;
    } catch {
      setError("Could not open the file picker. Try again or use Add by ID.");
      return null;
    }
  }, []);

  const runImport = useCallback(
    async (selected: MobileUploadFile) => {
      setUploading(true);
      setError(null);
      try {
        const result = await importStudentsToSection(sectionId, selected);
        onSaved(importResultSummary(result));
        onClose();
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setUploading(false);
      }
    },
    [sectionId, onSaved, onClose],
  );

  const handleImportPress = async () => {
    if (uploading) return;

    let selected = file;
    if (!selected) {
      selected = await pickFile();
      if (!selected) return;
    }

    await runImport(selected);
  };

  const handleManualAdd = () => {
    onClose();
    onUseManualAdd();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, DOCTOR_SPACE.lg),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { fontSize: layout.scale(18) }]}>Import students</Text>
              <Text style={[styles.subtitle, { fontSize: layout.scale(13) }]}>
                Upload a class roster containing university student IDs.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={22} color={colors.foreground} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form}>
            <Pressable
              onPress={() => void pickFile()}
              disabled={uploading}
              style={({ pressed }) => [styles.dropZone, { opacity: pressed || uploading ? 0.85 : 1 }]}
            >
              <Upload size={28} color={colors.primary} strokeWidth={1.8} />
              <Text style={[styles.dropTitle, { fontSize: layout.scale(15) }]}>
                {file ? file.name : "Tap to choose a roster file"}
              </Text>
              <Text style={[styles.dropHint, { fontSize: layout.scale(12) }]}>
                CSV, Excel (.xlsx), Word (.docx), or PDF
              </Text>
            </Pressable>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              disabled={uploading}
              style={({ pressed }) => [styles.ghostBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.ghostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleManualAdd}
              disabled={uploading}
              style={({ pressed }) => [styles.outlineBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.outlineText}>Add by ID</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleImportPress()}
              disabled={uploading}
              style={({ pressed }) => [
                styles.saveBtn,
                { opacity: uploading ? 0.7 : pressed ? 0.9 : 1 },
              ]}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FileUp size={16} color="#fff" strokeWidth={2} />
                  <Text style={styles.saveText}>Import</Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: HubColorScheme) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    sheet: {
      maxHeight: "80%",
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: DOCTOR_RADIUS.xl,
      borderTopRightRadius: DOCTOR_RADIUS.xl,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.lg,
      paddingBottom: DOCTOR_SPACE.sm,
      zIndex: 2,
      elevation: 2,
    },
    headerText: { flex: 1, paddingRight: DOCTOR_SPACE.md },
    title: { fontWeight: "800", color: colors.foreground },
    subtitle: { marginTop: 4, fontWeight: "500", color: colors.muted },
    closeBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: DOCTOR_RADIUS.pill,
      backgroundColor: colors.border,
    },
    form: { paddingHorizontal: DOCTOR_SPACE.lg, paddingBottom: DOCTOR_SPACE.md },
    dropZone: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DOCTOR_SPACE.xxxl,
      paddingHorizontal: DOCTOR_SPACE.lg,
      borderRadius: DOCTOR_RADIUS.lg,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.border,
      backgroundColor: colors.background,
      gap: DOCTOR_SPACE.sm,
    },
    dropTitle: {
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
    },
    dropHint: {
      fontWeight: "500",
      color: colors.muted,
      textAlign: "center",
    },
    errorText: {
      marginTop: DOCTOR_SPACE.md,
      fontSize: 13,
      fontWeight: "600",
      color: "#DC2626",
    },
    footer: {
      flexDirection: "row",
      gap: DOCTOR_SPACE.xs,
      paddingHorizontal: DOCTOR_SPACE.lg,
      paddingTop: DOCTOR_SPACE.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    ghostBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DOCTOR_SPACE.md,
    },
    ghostText: { fontWeight: "700", color: colors.muted, fontSize: 13 },
    outlineBtn: {
      flex: 1.1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    outlineText: { fontWeight: "700", color: colors.foreground, fontSize: 13 },
    saveBtn: {
      flex: 1.2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: DOCTOR_SPACE.md,
      borderRadius: DOCTOR_RADIUS.sm,
      backgroundColor: colors.primary,
      minHeight: 48,
    },
    saveText: { fontWeight: "700", color: "#fff", fontSize: 13 },
  });
}
