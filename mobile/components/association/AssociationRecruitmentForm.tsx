import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  uploadRecruitmentCampaignCover,
  type CreateRecruitmentCampaignPayload,
  type RecruitmentPositionInput,
} from "@/api/recruitmentCampaignsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationDateTimeField } from "@/components/association/AssociationDateTimeField";
import { AssociationTextField } from "@/components/association/AssociationTextField";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { showAlert } from "@/lib/confirmAlert";

export type RecruitmentFormState = {
  title: string;
  description: string;
  applicationDeadline: Date | null;
  coverImageUrl: string | null;
  positions: RecruitmentPositionInput[];
};

export function emptyRecruitmentFormState(): RecruitmentFormState {
  return {
    title: "",
    description: "",
    applicationDeadline: null,
    coverImageUrl: null,
    positions: [
      {
        roleTitle: "",
        neededCount: 1,
        description: "",
        requirements: "",
        requiredSkills: "",
      },
    ],
  };
}

type Props = {
  initial: RecruitmentFormState;
  submitLabel: string;
  saving: boolean;
  onSubmit: (payload: CreateRecruitmentCampaignPayload) => Promise<void>;
  onCancel: () => void;
};

function positionsToPayload(
  positions: RecruitmentPositionInput[],
): RecruitmentPositionInput[] {
  return positions.map((position, index) => ({
    id: position.id ?? undefined,
    roleTitle: position.roleTitle.trim(),
    neededCount:
      Number.isFinite(position.neededCount) && position.neededCount >= 1
        ? position.neededCount
        : 1,
    description: position.description?.trim() || null,
    requirements: position.requirements?.trim() || null,
    requiredSkills: position.requiredSkills?.trim() || null,
    displayOrder: index,
  }));
}

function buildValidationErrors(
  form: RecruitmentFormState,
): Record<string, string> {
  const next: Record<string, string> = {};

  if (!form.title.trim()) next.title = "Title is required.";
  if (!form.description.trim()) next.description = "Description is required.";

  if (!form.applicationDeadline) {
    next.applicationDeadline = "Selection applications deadline is required.";
  } else if (form.applicationDeadline.getTime() <= Date.now()) {
    next.applicationDeadline =
      "Selection applications deadline must be in the future.";
  }

  if (form.positions.length === 0) {
    next.positions = "Add at least one open position.";
  }

  form.positions.forEach((position, index) => {
    if (!position.roleTitle.trim()) {
      next[`positions.${index}.roleTitle`] = "Position title is required.";
    }
  });

  return next;
}

function serializeFormForLog(form: RecruitmentFormState) {
  return {
    title: form.title,
    description: form.description,
    applicationDeadline: form.applicationDeadline?.toISOString() ?? null,
    coverImageUrl: form.coverImageUrl,
    positions: form.positions,
  };
}

export function AssociationRecruitmentForm({
  initial,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<RecruitmentFormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const visibleErrors = useMemo(
    () => (submitAttempted ? Object.values(errors).filter(Boolean) : []),
    [submitAttempted, errors],
  );

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
      showAlert("Upload failed", parseApiErrorMessage(err));
    } finally {
      setUploadingCover(false);
    }
  };

  const updatePosition = (
    index: number,
    patch: Partial<RecruitmentPositionInput>,
  ) => {
    setForm((prev) => ({
      ...prev,
      positions: prev.positions.map((position, i) =>
        i === index ? { ...position, ...patch } : position,
      ),
    }));
  };

  const addPosition = () => {
    setForm((prev) => ({
      ...prev,
      positions: [
        ...prev.positions,
        {
          roleTitle: "",
          neededCount: 1,
          description: "",
          requirements: "",
          requiredSkills: "",
        },
      ],
    }));
  };

  const handleSubmit = async () => {
    console.log("[AssociationRecruitmentForm] handleSubmit called");
    setSubmitAttempted(true);
    console.log(
      "[AssociationRecruitmentForm] form values before submit:",
      serializeFormForLog(form),
    );

    const validationErrors = buildValidationErrors(form);
    const valid = Object.keys(validationErrors).length === 0;
    setErrors(validationErrors);
    console.log(
      "[AssociationRecruitmentForm] validation result:",
      valid,
      validationErrors,
    );

    if (!valid) return;

    if (!form.applicationDeadline) {
      setErrors({
        applicationDeadline: "Selection applications deadline is required.",
      });
      return;
    }

    const payload: CreateRecruitmentCampaignPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      applicationDeadline: form.applicationDeadline.toISOString(),
      coverImageUrl: form.coverImageUrl,
      isPublished: false,
      positions: positionsToPayload(form.positions),
    };

    console.log("[AssociationRecruitmentForm] request payload:", payload);

    try {
      await onSubmit(payload);
      console.log(
        "[AssociationRecruitmentForm] onSubmit completed successfully",
      );
    } catch (err) {
      console.error("[AssociationRecruitmentForm] onSubmit error:", err);
      throw err;
    }
  };

  return (
    <View style={{ width: "100%" }}>
      <AssociationTextField
        label="Title"
        value={form.title}
        onChangeText={(title) => setForm((prev) => ({ ...prev, title }))}
        placeholder="e.g. Fall 2026 Executive Board Selection Applications"
        error={errors.title}
      />
      <AssociationTextField
        label="Description"
        value={form.description}
        onChangeText={(description) =>
          setForm((prev) => ({ ...prev, description }))
        }
        multiline
        placeholder="Selection applications are now open for executive board positions — describe who should apply, what teams are forming, and what students will gain."
        error={errors.description}
      />

      <AssociationActionButton
        label={
          uploadingCover
            ? "Uploading…"
            : form.coverImageUrl
              ? "Change cover image"
              : "Upload cover image"
        }
        variant="outline"
        loading={uploadingCover}
        onPress={() => void pickCover()}
      />
      {form.coverImageUrl ? (
        <Text style={styles.hint}>Cover image uploaded</Text>
      ) : null}

      <AssociationDateTimeField
        label="Selection applications deadline"
        value={form.applicationDeadline}
        onChange={(applicationDeadline) =>
          setForm((prev) => ({ ...prev, applicationDeadline }))
        }
        error={errors.applicationDeadline}
        placeholder="Select date and time"
      />

      {errors.positions ? (
        <Text style={styles.positionsError}>{errors.positions}</Text>
      ) : null}

      {form.positions.map((position, index) => (
        <View key={index} style={styles.positionCard}>
          <Text style={styles.positionTitle}>Position {index + 1}</Text>
          <AssociationTextField
            label="Role title"
            value={position.roleTitle}
            onChangeText={(roleTitle) => updatePosition(index, { roleTitle })}
            error={errors[`positions.${index}.roleTitle`]}
          />
          <AssociationTextField
            label="Needed count"
            value={String(position.neededCount)}
            onChangeText={(value) =>
              updatePosition(index, { neededCount: Number(value) || 1 })
            }
            keyboardType="numeric"
          />
          <AssociationTextField
            label="Description"
            value={position.description ?? ""}
            onChangeText={(description) =>
              updatePosition(index, { description })
            }
            multiline
          />
          <AssociationTextField
            label="Requirements"
            value={position.requirements ?? ""}
            onChangeText={(requirements) =>
              updatePosition(index, { requirements })
            }
            multiline
            placeholder="Describe experience, availability, or other requirements"
          />
          <AssociationTextField
            label="Required skills (comma-separated)"
            value={position.requiredSkills ?? ""}
            onChangeText={(requiredSkills) =>
              updatePosition(index, { requiredSkills })
            }
            placeholder="e.g. React, Public speaking, Design"
          />
        </View>
      ))}

      <AssociationActionButton
        label="Add position"
        variant="outline"
        onPress={addPosition}
      />

      {visibleErrors.length > 0 ? (
        <View style={styles.validationSummary}>
          {visibleErrors.map((message) => (
            <Text key={message} style={styles.validationSummaryText}>
              {message}
            </Text>
          ))}
        </View>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 16,
        }}
      >
        <AssociationActionButton
          label={saving ? "Saving…" : submitLabel}
          loading={saving}
          disabled={saving}
          onPress={() => {
            console.log("[AssociationRecruitmentForm] Create button pressed");
            void handleSubmit();
          }}
        />
        <AssociationActionButton
          label="Cancel"
          variant="outline"
          onPress={onCancel}
          disabled={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: ASSOC_COLORS.muted, fontSize: 12, marginBottom: 12 },
  positionsError: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
  },
  positionCard: {
    borderWidth: 1,
    borderColor: ASSOC_COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: ASSOC_COLORS.cardBg,
  },
  positionTitle: {
    fontWeight: "800",
    color: ASSOC_COLORS.foreground,
    marginBottom: 8,
  },
  validationSummary: {
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    gap: 4,
  },
  validationSummaryText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "500",
  },
});
