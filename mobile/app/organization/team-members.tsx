import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  createOrganizationTeamMember,
  deleteOrganizationTeamMember,
  listOrganizationTeamMembers,
  updateOrganizationTeamMember,
  uploadOrganizationTeamMemberPortraitFromUri,
  type OrganizationTeamMember,
} from "@/api/organizationTeamMembersApi";
import { OrgScreenHeader } from "@/components/organization/OrgScreenHeader";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { clearSession } from "@/utils/authStorage";

type Draft = {
  fullName: string;
  roleTitle: string;
  major: string;
  imageUrl: string;
  linkedInUrl: string;
  displayOrder: string;
};

function emptyDraft(): Draft {
  return {
    fullName: "",
    roleTitle: "",
    major: "",
    imageUrl: "",
    linkedInUrl: "",
    displayOrder: "0",
  };
}

function draftFromMember(m: OrganizationTeamMember): Draft {
  return {
    fullName: m.fullName,
    roleTitle: m.roleTitle,
    major: m.major ?? "",
    imageUrl: m.imageUrl ?? "",
    linkedInUrl: m.linkedInUrl ?? "",
    displayOrder: String(m.displayOrder ?? 0),
  };
}

function sortMembers(list: OrganizationTeamMember[]): OrganizationTeamMember[] {
  return [...list].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export default function OrganizationTeamMembersScreen() {
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<OrganizationTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [portraitBusy, setPortraitBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const sorted = useMemo(() => sortMembers(members), [members]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOrganizationTeamMembers();
      setMembers(data);
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await clearSession();
    router.replace("/login" as Href);
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  };

  const openEdit = (m: OrganizationTeamMember) => {
    setEditingId(m.id);
    setDraft(draftFromMember(m));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const pickPortrait = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    setPortraitBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const url = await uploadOrganizationTeamMemberPortraitFromUri(
        a.uri,
        a.mimeType ?? "image/jpeg",
      );
      setDraft((d) => ({ ...d, imageUrl: url }));
    } catch (e) {
      Alert.alert("Upload failed", parseApiErrorMessage(e));
    } finally {
      setPortraitBusy(false);
    }
  };

  const submitForm = async () => {
    const orderRaw = parseInt(draft.displayOrder.trim(), 10);
    const displayOrder = Number.isFinite(orderRaw) ? orderRaw : 0;
    const fullName = draft.fullName.trim();
    const roleTitle = draft.roleTitle.trim();
    if (!fullName || !roleTitle) {
      Alert.alert("Validation", "Full name and role title are required.");
      return;
    }
    const payload = {
      fullName,
      roleTitle,
      major: draft.major.trim() || null,
      imageUrl: draft.imageUrl.trim() || null,
      linkedInUrl: draft.linkedInUrl.trim() || null,
      displayOrder,
    };
    setSaving(true);
    try {
      if (editingId != null) {
        const updated = await updateOrganizationTeamMember(editingId, payload);
        setMembers((prev) => sortMembers(prev.map((x) => (x.id === updated.id ? updated : x))));
        Alert.alert("Saved", "Leadership member updated.");
      } else {
        const created = await createOrganizationTeamMember(payload);
        setMembers((prev) => sortMembers([...prev, created]));
        Alert.alert("Added", "Leadership member added to your public showcase.");
      }
      closeForm();
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (m: OrganizationTeamMember) => {
    Alert.alert(
      "Remove from showcase",
      `Remove ${m.fullName} from the public leadership list? This does not affect any SkillSwap accounts.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => void doDelete(m),
        },
      ],
    );
  };

  const doDelete = async (m: OrganizationTeamMember) => {
    setDeletingId(m.id);
    try {
      await deleteOrganizationTeamMember(m.id);
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      Alert.alert("Error", parseApiErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  const kav = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <OrgScreenHeader
        title="Leadership team"
        subtitle="Student Organization"
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => void logout()} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color={assocColors.accentDark} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl,
        }}
      >
        <Text style={styles.intro}>
          Showcase coordinators and representatives on your public profile. People listed here are visible only —
          they do not get app admin access.
        </Text>
        <Pressable style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.addBtnTxt}>Add member</Text>
        </Pressable>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={assocColors.accent} />
            <Text style={styles.muted}>Loading team…</Text>
          </View>
        ) : sorted.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={assocColors.accent} />
            <Text style={styles.emptyTitle}>No one listed yet</Text>
            <Text style={styles.emptySub}>
            Highlight your elected leads and coordinators. Tap “Add member” to get started.
            </Text>
            <Pressable style={styles.addBtnAlt} onPress={openCreate}>
              <Text style={styles.addBtnAltTxt}>Add your first member</Text>
            </Pressable>
          </View>
        ) : (
          sorted.map((m) => {
            const img = resolveApiFileUrl(m.imageUrl ?? undefined);
            const initial = m.fullName.trim().charAt(0).toUpperCase() || "?";
            return (
              <View key={m.id} style={styles.card}>
                <View style={styles.cardTop}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={styles.thumbPh}>
                      <Text style={styles.thumbPhTxt}>{initial}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.cardName} numberOfLines={2}>
                      {m.fullName}
                    </Text>
                    <Text style={styles.cardRole} numberOfLines={2}>
                      {m.roleTitle}
                    </Text>
                    {m.major?.trim() ? (
                      <Text style={styles.cardMajor} numberOfLines={2}>
                        {m.major.trim()}
                      </Text>
                    ) : null}
                    <Text style={styles.cardOrder}>Order: {m.displayOrder}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Pressable style={styles.editBtn} onPress={() => openEdit(m)} hitSlop={6}>
                    <Ionicons name="pencil-outline" size={18} color={assocColors.accentDark} />
                    <Text style={styles.editTxt}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.delBtn}
                    onPress={() => confirmDelete(m)}
                    disabled={deletingId === m.id}
                    hitSlop={6}
                  >
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    <Text style={styles.delTxt}>{deletingId === m.id ? "…" : "Remove"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={formOpen} animationType="slide" onRequestClose={closeForm}>
        <SafeAreaView style={styles.modalSafe} edges={["top", "left", "right"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={kav}
            keyboardVerticalOffset={insets.top + spacing.sm}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={closeForm} hitSlop={12}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>{editingId != null ? "Edit member" : "New member"}</Text>
              <View style={{ width: 56 }} />
            </View>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: layout.horizontalPadding,
                paddingBottom: spacing.xxxl + insets.bottom,
                paddingTop: spacing.sm,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalHint}>
                This information appears on your public organization profile for students to see who represents your
                club.
              </Text>

              <Pressable style={styles.portraitBox} onPress={pickPortrait} disabled={portraitBusy || saving}>
                {draft.imageUrl.trim() ? (
                  <Image
                    source={{ uri: resolveApiFileUrl(draft.imageUrl.trim())! }}
                    style={styles.portraitImg}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.portraitHint}>Tap to add portrait (optional)</Text>
                )}
                {portraitBusy ? (
                  <View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(255,255,255,0.55)",
                    }}
                  >
                    <ActivityIndicator color={assocColors.accent} size="large" />
                  </View>
                ) : null}
              </Pressable>

              <FormLabel>Image URL (optional)</FormLabel>
              <TextInput
                value={draft.imageUrl}
                onChangeText={(t) => setDraft((d) => ({ ...d, imageUrl: t }))}
                placeholder="https://…"
                placeholderTextColor={assocColors.subtle}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <FormLabel required>Full name</FormLabel>
              <TextInput
                value={draft.fullName}
                onChangeText={(t) => setDraft((d) => ({ ...d, fullName: t }))}
                style={styles.input}
              />

              <FormLabel required>Role title</FormLabel>
              <TextInput
                value={draft.roleTitle}
                onChangeText={(t) => setDraft((d) => ({ ...d, roleTitle: t }))}
                placeholder="e.g. President, Events Coordinator"
                placeholderTextColor={assocColors.subtle}
                style={styles.input}
              />

              <FormLabel>Major</FormLabel>
              <TextInput
                value={draft.major}
                onChangeText={(t) => setDraft((d) => ({ ...d, major: t }))}
                style={styles.input}
              />

              <FormLabel>LinkedIn URL</FormLabel>
              <TextInput
                value={draft.linkedInUrl}
                onChangeText={(t) => setDraft((d) => ({ ...d, linkedInUrl: t }))}
                placeholder="https://linkedin.com/in/…"
                placeholderTextColor={assocColors.subtle}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <FormLabel>Display order</FormLabel>
              <TextInput
                value={draft.displayOrder}
                onChangeText={(t) => setDraft((d) => ({ ...d, displayOrder: t }))}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Text style={styles.orderHint}>Lower numbers appear first on your public profile.</Text>

              <Pressable
                style={[styles.saveBtn, saving && { opacity: 0.75 }]}
                onPress={() => void submitForm()}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveTxt}>{editingId != null ? "Save changes" : "Add to showcase"}</Text>
                )}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FormLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Text style={styles.formLabel}>
      {children}
      {required ? <Text style={{ color: "#dc2626" }}> *</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: assocColors.bg },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: assocColors.muted,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
    marginBottom: spacing.lg,
  },
  addBtnTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },
  center: { paddingVertical: spacing.xxl, alignItems: "center" },
  muted: { marginTop: spacing.sm, color: assocColors.muted, fontWeight: "600" },
  empty: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
  },
  emptyTitle: { marginTop: spacing.md, fontSize: 18, fontWeight: "900", color: assocColors.text },
  emptySub: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: 14,
    color: assocColors.muted,
    lineHeight: 20,
    fontWeight: "600",
  },
  addBtnAlt: {
    marginTop: spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.accentBorder,
    backgroundColor: assocColors.accentMuted,
  },
  addBtnAltTxt: { fontWeight: "800", color: assocColors.accentDark },
  card: {
    backgroundColor: assocColors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: assocColors.accentBorder,
  },
  thumbPh: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: assocColors.accentMuted,
    borderWidth: 2,
    borderColor: assocColors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbPhTxt: { fontSize: 18, fontWeight: "900", color: assocColors.accentDark },
  cardName: { fontSize: 16, fontWeight: "900", color: assocColors.text },
  cardRole: { marginTop: 4, fontSize: 13, fontWeight: "800", color: assocColors.accent },
  cardMajor: { marginTop: 6, fontSize: 12, color: assocColors.muted, fontWeight: "600" },
  cardOrder: { marginTop: 8, fontSize: 11, color: assocColors.subtle, fontWeight: "700" },
  cardActions: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: assocColors.border,
  },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  editTxt: { fontSize: 14, fontWeight: "800", color: assocColors.accentDark },
  delBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  delTxt: { fontSize: 14, fontWeight: "800", color: "#dc2626" },
  modalSafe: { flex: 1, backgroundColor: assocColors.bg },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: assocColors.border,
    backgroundColor: assocColors.surface,
  },
  modalCancel: { fontSize: 16, fontWeight: "700", color: assocColors.accentDark, width: 56 },
  modalTitle: { fontSize: 16, fontWeight: "900", color: assocColors.text },
  modalHint: {
    fontSize: 13,
    color: assocColors.muted,
    lineHeight: 18,
    marginBottom: spacing.md,
    fontWeight: "600",
  },
  portraitBox: {
    height: 120,
    width: 120,
    alignSelf: "center",
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: assocColors.accentMuted,
    borderWidth: 2,
    borderColor: assocColors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  portraitImg: { width: "100%", height: "100%" },
  portraitHint: { paddingHorizontal: 8, textAlign: "center", color: assocColors.accentDark, fontWeight: "700" },
  formLabel: { fontSize: 12, fontWeight: "800", color: assocColors.text, marginBottom: 6, marginTop: spacing.sm },
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
  orderHint: { marginTop: 6, fontSize: 11, color: assocColors.muted, fontWeight: "600" },
  saveBtn: {
    marginTop: spacing.xl,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
