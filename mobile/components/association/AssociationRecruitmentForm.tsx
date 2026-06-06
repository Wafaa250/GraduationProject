import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  uploadRecruitmentCampaignCover,
  type CreateRecruitmentCampaignPayload,
  type RecruitmentPositionInput,
} from "@/api/recruitmentCampaignsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationTextField } from "@/components/association/AssociationTextField";
import { ASSOC_COLORS } from "@/constants/associationTheme";

export type RecruitmentFormState = {
  title: string;
  description: string;
  applicationDeadline: Date;
  coverImageUrl: string | null;
  positions: RecruitmentPositionInput[];
};

export function emptyRecruitmentFormState(): RecruitmentFormState {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 0, 0);
  return {
    title: "",
    description: "",
    applicationDeadline: nextWeek,
    coverImageUrl: null,
    positions: [{ roleTitle: "", neededCount: 1, description: "", requirements: "", requiredSkills: "" }],
  };
}

type Props = {
  initial: RecruitmentFormState;
  submitLabel: string;
  saving: boolean;
  onSubmit: (payload: CreateRecruitmentCampaignPayload) => Promise<void>;
  onCancel: () => void;
};

export function AssociationRecruitmentForm({ initial, submitLabel, saving, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<RecruitmentFormState>(initial);
  const [showPicker, setShowPicker] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingCover(true);
    try {
      const url = await uploadRecruitmentCampaignCover({
        uri: asset.uri,
        name: asset.fileName ?? "cover.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      setForm((prev) => ({ ...prev, coverImageUrl: url }));
    } catch (err) {
      Alert.alert("Upload failed", parseApiErrorMessage(err));
    } finally {
      setUploadingCover(false);
    }
  };

  const updatePosition = (index: number, patch: Partial<RecruitmentPositionInput>) => {
    setForm((prev) => ({
      ...prev,
      positions: prev.positions.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  };

  const addPosition = () => {
    setForm((prev) => ({
      ...prev,
      positions: [
        ...prev.positions,
        { roleTitle: "", neededCount: 1, description: "", requirements: "", requiredSkills: "" },
      ],
    }));
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    const validPositions = form.positions.filter((p) => p.roleTitle.trim());
    if (validPositions.length === 0) return "Add at least one position with a role title";
    if (form.applicationDeadline.getTime() <= Date.now()) return "Application deadline must be in the future";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Check form", err);
      return;
    }
    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      applicationDeadline: form.applicationDeadline.toISOString(),
      coverImageUrl: form.coverImageUrl,
      isPublished: false,
      positions: form.positions
        .filter((p) => p.roleTitle.trim())
        .map((p, index) => ({
          ...p,
          roleTitle: p.roleTitle.trim(),
          neededCount: Math.max(1, Number(p.neededCount) || 1),
          displayOrder: index,
        })),
    });
  };

  return (
    <View style={{ width: "100%" }}>
      <AssociationTextField label="Campaign title" value={form.title} onChangeText={(title) => setForm((p) => ({ ...p, title }))} />
      <AssociationTextField label="Description" value={form.description} onChangeText={(description) => setForm((p) => ({ ...p, description }))} multiline />

      <AssociationActionButton
        label={uploadingCover ? "Uploading…" : form.coverImageUrl ? "Change cover image" : "Upload cover image"}
        variant="outline"
        loading={uploadingCover}
        onPress={() => void pickCover()}
      />
      {form.coverImageUrl ? <Text style={styles.hint}>Cover image uploaded</Text> : null}

      <Pressable onPress={() => setShowPicker(true)} style={styles.dateBtn}>
        <Text style={styles.label}>Application deadline</Text>
        <Text style={styles.dateValue}>{form.applicationDeadline.toLocaleString()}</Text>
      </Pressable>

      {form.positions.map((position, index) => (
        <View key={index} style={styles.positionCard}>
          <Text style={styles.positionTitle}>Position {index + 1}</Text>
          <AssociationTextField
            label="Role title"
            value={position.roleTitle}
            onChangeText={(roleTitle) => updatePosition(index, { roleTitle })}
          />
          <AssociationTextField
            label="Needed count"
            value={String(position.neededCount)}
            onChangeText={(v) => updatePosition(index, { neededCount: Number(v) || 1 })}
            keyboardType="numeric"
          />
          <AssociationTextField
            label="Description"
            value={position.description ?? ""}
            onChangeText={(description) => updatePosition(index, { description })}
            multiline
          />
          <AssociationTextField
            label="Requirements"
            value={position.requirements ?? ""}
            onChangeText={(requirements) => updatePosition(index, { requirements })}
            multiline
            placeholder="Describe experience, availability, or other requirements"
          />
          <AssociationTextField
            label="Required skills (comma-separated)"
            value={position.requiredSkills ?? ""}
            onChangeText={(requiredSkills) => updatePosition(index, { requiredSkills })}
            placeholder="e.g. React, Public speaking, Design"
          />
        </View>
      ))}

      <AssociationActionButton label="Add position" variant="outline" onPress={addPosition} />

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        <AssociationActionButton label={submitLabel} loading={saving} onPress={() => void handleSubmit()} />
        <AssociationActionButton label="Cancel" variant="outline" onPress={onCancel} disabled={saving} />
      </View>

      {showPicker ? (
        <DateTimePicker
          value={form.applicationDeadline}
          mode="datetime"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            if (Platform.OS === "android") setShowPicker(false);
            if (event.type !== "dismissed" && date) setForm((p) => ({ ...p, applicationDeadline: date }));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: "700", color: ASSOC_COLORS.foreground },
  dateBtn: {
    marginBottom: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    borderRadius: 12,
    backgroundColor: ASSOC_COLORS.inputBg,
  },
  dateValue: { color: ASSOC_COLORS.muted, marginTop: 4 },
  hint: { color: ASSOC_COLORS.muted, fontSize: 12, marginBottom: 12 },
  positionCard: {
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: ASSOC_COLORS.cardBg,
  },
  positionTitle: { fontWeight: "800", color: ASSOC_COLORS.foreground, marginBottom: 8 },
});
