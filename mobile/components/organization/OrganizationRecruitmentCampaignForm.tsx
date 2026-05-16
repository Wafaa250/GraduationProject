import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { parseApiErrorMessage, resolveApiFileUrl } from "@/api/axiosInstance";
import {
  type CreateRecruitmentCampaignPayload,
  type RecruitmentCampaign,
  uploadRecruitmentCampaignCoverFromUri,
} from "@/api/organizationRecruitmentCampaignsApi";
import { MobileDateTimeField } from "@/components/organization/MobileDateTimeField";
import {
  draftsToPayload,
  newPositionDraft,
  positionsFromCampaign,
  RecruitmentPositionsEditor,
  type PositionDraft,
} from "@/components/organization/RecruitmentPositionsEditor";
import { assocColors } from "@/constants/associationTheme";
import { radius, spacing } from "@/constants/responsiveLayout";

type FormValues = {
  title: string;
  description: string;
  applicationDeadlineIso: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  positions: PositionDraft[];
};

function emptyValues(): FormValues {
  return {
    title: "",
    description: "",
    applicationDeadlineIso: "",
    coverImageUrl: null,
    isPublished: true,
    positions: [newPositionDraft(0)],
  };
}

function campaignToValues(c: RecruitmentCampaign): FormValues {
  return {
    title: c.title,
    description: c.description,
    applicationDeadlineIso: c.applicationDeadline,
    coverImageUrl: c.coverImageUrl ?? null,
    isPublished: c.isPublished,
    positions:
      c.positions.length > 0 ? positionsFromCampaign(c.positions) : [newPositionDraft(0)],
  };
}

type Props = {
  initialCampaign?: RecruitmentCampaign;
  submitLabel: string;
  saving: boolean;
  onSubmit: (payload: CreateRecruitmentCampaignPayload) => Promise<void>;
  onCancel: () => void;
  footer?: ReactNode;
  campaignId?: number;
};

export function OrganizationRecruitmentCampaignForm({
  initialCampaign,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
  footer,
  campaignId,
}: Props) {
  const [form, setForm] = useState<FormValues>(() =>
    initialCampaign ? campaignToValues(initialCampaign) : emptyValues(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverErr, setCoverErr] = useState<string | null>(null);

  useEffect(() => {
    if (initialCampaign) setForm(campaignToValues(initialCampaign));
  }, [initialCampaign]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (!form.applicationDeadlineIso) {
      next.applicationDeadlineIso = "Application deadline is required.";
    } else {
      const d = new Date(form.applicationDeadlineIso);
      if (!Number.isNaN(d.getTime()) && d <= new Date()) {
        next.applicationDeadlineIso = "Application deadline must be in the future.";
      }
    }
    if (form.positions.length === 0) next.positions = "Add at least one position.";
    form.positions.forEach((p, i) => {
      if (!p.roleTitle.trim()) next[`positions.${i}.roleTitle`] = "Role title is required.";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      applicationDeadline: form.applicationDeadlineIso,
      coverImageUrl: form.coverImageUrl,
      isPublished: form.isPublished,
      positions: draftsToPayload(form.positions),
    });
  };

  const pickCover = async () => {
    setCoverErr(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    setCoverBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const uri = a.uri;
      const mime = a.mimeType ?? "image/jpeg";
      const name = uri.split("/").pop() ?? "cover.jpg";
      const url = await uploadRecruitmentCampaignCoverFromUri(uri, mime, name);
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (e) {
      setCoverErr(parseApiErrorMessage(e));
    } finally {
      setCoverBusy(false);
    }
  };

  const coverDisplay = resolveApiFileUrl(form.coverImageUrl ?? undefined);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>Campaign details</Text>
        <Field label="Campaign title" error={errors.title} required>
          <TextInput
            value={form.title}
            onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
            placeholder="e.g. IEEE Recruitment Fall 2026"
            placeholderTextColor={assocColors.subtle}
            style={styles.input}
            editable={!saving}
          />
        </Field>
        <Field label="Description" error={errors.description} required>
          <TextInput
            value={form.description}
            onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
            placeholder="Tell students about your recruitment campaign"
            placeholderTextColor={assocColors.subtle}
            style={[styles.input, styles.textArea]}
            multiline
            textAlignVertical="top"
            editable={!saving}
          />
        </Field>

        <MobileDateTimeField
          label="Application deadline *"
          valueIso={form.applicationDeadlineIso}
          onChangeIso={(iso) => setForm((f) => ({ ...f, applicationDeadlineIso: iso }))}
        />
        {errors.applicationDeadlineIso ? (
          <Text style={styles.err}>{errors.applicationDeadlineIso}</Text>
        ) : null}

        <View style={styles.switchRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.switchLabel}>Publish on public profile</Text>
            <Text style={styles.switchHint}>Visible to students browsing your organization</Text>
          </View>
          <Switch
            value={form.isPublished}
            onValueChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
            trackColor={{ false: "#e2e8f0", true: assocColors.accentBorder }}
            thumbColor={form.isPublished ? assocColors.accent : "#f4f4f5"}
            disabled={saving}
          />
        </View>

        <Text style={styles.section}>Cover image</Text>
        <Pressable
          onPress={pickCover}
          disabled={saving || coverBusy}
          style={[styles.coverBox, coverDisplay && styles.coverBoxOn]}
        >
          {coverDisplay ? (
            <Image source={{ uri: coverDisplay }} style={styles.coverImg} contentFit="cover" />
          ) : (
            <Text style={styles.coverHint}>Tap to upload cover</Text>
          )}
          {coverBusy ? <ActivityIndicator style={styles.coverSpin} color={assocColors.accent} /> : null}
        </Pressable>
        {coverErr ? <Text style={styles.err}>{coverErr}</Text> : null}

        {errors.positions ? <Text style={styles.err}>{errors.positions}</Text> : null}
        {form.positions.map((_, i) =>
          errors[`positions.${i}.roleTitle`] ? (
            <Text key={i} style={styles.err}>
              Position {i + 1}: {errors[`positions.${i}.roleTitle`]}
            </Text>
          ) : null,
        )}

        <RecruitmentPositionsEditor
          positions={form.positions}
          onChange={(positions) => setForm((f) => ({ ...f, positions }))}
          disabled={saving}
          campaignId={campaignId}
        />

        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={styles.btnSecondary} disabled={saving}>
            <Text style={styles.btnSecondaryText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => void handleSubmit()}
            style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>{submitLabel}</Text>
            )}
          </Pressable>
        </View>

        {footer}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={{ color: "#dc2626" }}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  section: {
    fontSize: 15,
    fontWeight: "800",
    color: assocColors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: assocColors.text, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: assocColors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: assocColors.text,
    backgroundColor: assocColors.bg,
    minHeight: 48,
  },
  textArea: { minHeight: 120 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  switchLabel: { fontSize: 14, fontWeight: "700", color: assocColors.text },
  switchHint: { fontSize: 12, color: assocColors.muted, marginTop: 2 },
  coverBox: {
    height: 160,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: assocColors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.accentMuted,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  coverBoxOn: { borderStyle: "solid" },
  coverImg: { width: "100%", height: "100%" },
  coverHint: { color: assocColors.accentDark, fontWeight: "700" },
  coverSpin: { position: "absolute" },
  err: { color: "#dc2626", fontSize: 12, fontWeight: "600", marginTop: 4, marginBottom: spacing.sm },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    flexWrap: "wrap",
  },
  btnSecondary: {
    flex: 1,
    minWidth: 120,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: assocColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: assocColors.surface,
  },
  btnSecondaryText: { fontWeight: "700", color: assocColors.muted },
  btnPrimary: {
    flex: 1,
    minWidth: 120,
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: assocColors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  btnPrimaryText: { fontWeight: "800", color: "#fff", fontSize: 15 },
});
