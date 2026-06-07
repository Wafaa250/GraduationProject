import { useEffect, useRef, useState } from "react";
import { Alert, TextInput } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { parseApiErrorMessage } from "@/api/axiosInstance";

type Props = {
  value: string | null | undefined;
  placeholder?: string;
  onSave: (note: string | null) => Promise<void>;
};

export function CompanySavedRecommendationNoteField({
  value,
  placeholder = "Add internal note...",
  onSave,
}: Props) {
  const colors = useCompanyTheme();
  const [draft, setDraft] = useState(value ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(value ?? "");

  useEffect(() => {
    const next = value ?? "";
    setDraft(next);
    lastSavedRef.current = next;
  }, [value]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const persist = async (next: string) => {
    const normalized = next.trim();
    const payload = normalized.length > 0 ? normalized : null;
    if (payload === (lastSavedRef.current.trim() || null)) return;
    try {
      await onSave(payload);
      lastSavedRef.current = payload ?? "";
    } catch (err) {
      Alert.alert("Could not save note", parseApiErrorMessage(err));
    }
  };

  const scheduleSave = (next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void persist(next);
    }, 600);
  };

  return (
    <TextInput
      value={draft}
      onChangeText={(text) => {
        setDraft(text);
        scheduleSave(text);
      }}
      onBlur={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        void persist(draft);
      }}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      multiline
      style={{
        marginTop: HOME_SPACE.sm,
        minHeight: 40,
        maxHeight: 88,
        paddingHorizontal: HOME_SPACE.md,
        paddingVertical: 10,
        borderRadius: COMPANY_RADIUS.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceMuted,
        fontSize: 13,
        lineHeight: 18,
        color: colors.foreground,
        textAlignVertical: "top",
      }}
    />
  );
}
