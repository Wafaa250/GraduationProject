import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  ASSOCIATION_CATEGORIES,
  getAssociationProfile,
  updateAssociationProfile,
  uploadAssociationLogoFromUri,
  type StudentAssociationProfile,
} from "@/api/associationApi";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { setItem } from "@/utils/authStorage";

const FACULTIES = [
  "Engineering and Information Technology",
  "Information Technology",
  "Science",
  "Medicine and Health Sciences",
  "Pharmacy",
  "Nursing",
  "Agriculture and Veterinary Medicine",
] as const;

export default function OrganizationProfileEditScreen() {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null);
  const [associationName, setAssociationName] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [faculty, setFaculty] = useState("");
  const [category, setCategory] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [pickerOpen, setPickerOpen] = useState<"faculty" | "category" | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssociationProfile();
      setProfile(data);
      setAssociationName(data.associationName);
      setUsername(data.username);
      setDescription(data.description ?? "");
      setFaculty(data.faculty ?? "");
      setCategory(data.category ?? "");
      setLogoUrl(data.logoUrl ?? "");
      setInstagramUrl(data.instagramUrl ?? "");
      setFacebookUrl(data.facebookUrl ?? "");
      setLinkedInUrl(data.linkedInUrl ?? "");
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    setLogoBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const url = await uploadAssociationLogoFromUri(a.uri, a.mimeType ?? "image/jpeg");
      setLogoUrl(url);
    } catch (e) {
      Alert.alert("Upload failed", parseApiErrorMessage(e));
    } finally {
      setLogoBusy(false);
    }
  };

  const save = async () => {
    if (!associationName.trim()) {
      Alert.alert("Validation", "Organization name is required.");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Validation", "Username is required.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      Alert.alert("Validation", "Username: letters, numbers, underscores only.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAssociationProfile({
        associationName: associationName.trim(),
        username: username.trim(),
        description: description.trim() || undefined,
        faculty: faculty.trim() || undefined,
        category: category || undefined,
        logoUrl: logoUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
        linkedInUrl: linkedInUrl.trim() || undefined,
      });
      setProfile(updated);
      await setItem("name", updated.associationName);
      Alert.alert("Saved", "Profile updated successfully.", [
        { text: "OK", onPress: () => router.replace("/organization/profile" as Href) },
      ]);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const kav = Platform.OS === "ios" ? "padding" : undefined;
  const preview = resolveApiFileUrl(logoUrl || undefined);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader title="Edit profile" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={kav}
        keyboardVerticalOffset={insets.top + spacing.sm}
      >
        {loading || !profile ? (
          <View style={styles.center}>
            <ActivityIndicator color={assocColors.accent} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: layout.horizontalPadding,
              paddingBottom: spacing.xxxl + insets.bottom,
              paddingTop: spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.logoBox} onPress={pickLogo} disabled={logoBusy || saving}>
              {preview ? (
                <Image source={{ uri: preview }} style={styles.logoImg} contentFit="cover" />
              ) : (
                <Text style={styles.logoHint}>Tap to change logo</Text>
              )}
              {logoBusy ? <ActivityIndicator style={styles.spin} /> : null}
            </Pressable>

            <Field label="Organization name *" value={associationName} onChangeText={setAssociationName} />
            <Field label="Username *" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={styles.lbl}>Faculty</Text>
            <Pressable style={styles.select} onPress={() => setPickerOpen("faculty")}>
              <Text style={[styles.selectTxt, !faculty && styles.ph]}>{faculty || "Select faculty"}</Text>
              <Text style={styles.chev}>▼</Text>
            </Pressable>

            <Text style={styles.lbl}>Category</Text>
            <Pressable style={styles.select} onPress={() => setPickerOpen("category")}>
              <Text style={[styles.selectTxt, !category && styles.ph]}>{category || "Select category"}</Text>
              <Text style={styles.chev}>▼</Text>
            </Pressable>

            <Field label="Instagram" value={instagramUrl} onChangeText={setInstagramUrl} autoCapitalize="none" />
            <Field label="Facebook" value={facebookUrl} onChangeText={setFacebookUrl} autoCapitalize="none" />
            <Field label="LinkedIn" value={linkedInUrl} onChangeText={setLinkedInUrl} autoCapitalize="none" />

            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.75 }]}
              onPress={() => void save()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveTxt}>Save changes</Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen != null} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setPickerOpen(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ScrollView style={{ maxHeight: layout.height * 0.55 }}>
              {(pickerOpen === "faculty" ? FACULTIES : ASSOCIATION_CATEGORIES).map((opt) => (
                <Pressable
                  key={opt}
                  style={styles.modalRow}
                  onPress={() => {
                    if (pickerOpen === "faculty") setFaculty(opt);
                    else setCategory(opt);
                    setPickerOpen(null);
                  }}
                >
                  <Text style={styles.modalRowTxt}>{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalX} onPress={() => setPickerOpen(null)}>
              <Text style={styles.modalXTxtw}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.lbl}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, multiline && { minHeight: 100, textAlignVertical: "top" }]}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={assocColors.subtle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoBox: {
    height: 120,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: assocColors.accentMuted,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logoImg: { width: "100%", height: "100%" },
  logoHint: { color: assocColors.accentDark, fontWeight: "700" },
  spin: { position: "absolute" },
  lbl: { fontSize: 12, fontWeight: "800", color: assocColors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: assocColors.text,
    backgroundColor: assocColors.surface,
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    backgroundColor: assocColors.surface,
    marginBottom: spacing.md,
  },
  selectTxt: { flex: 1, fontSize: 15, fontWeight: "600", color: assocColors.text },
  ph: { color: assocColors.subtle, fontWeight: "500" },
  chev: { fontSize: 10, color: assocColors.muted },
  saveBtn: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    paddingVertical: 8,
    maxHeight: "80%",
  },
  modalRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
  },
  modalRowTxt: { fontSize: 15, color: assocColors.text, fontWeight: "600" },
  modalX: { padding: 14, alignItems: "center" },
  modalXTxtw: { color: assocColors.accentDark, fontWeight: "800" },
});
