import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompanyProfileEditForm } from "@/components/company/profile/CompanyProfileEditForm";
import { CompanyProfileSkeleton } from "@/components/company/profile/CompanyProfileSkeleton";
import { createCompanyProfileStyles } from "@/components/company/profile/companyProfileStyles";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyProfilePage } from "@/hooks/useCompanyProfilePage";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { confirmAlert } from "@/lib/confirmAlert";
import { COMPANY_PROFILE_SUBTITLE } from "@/lib/companyWorkspaceCopy";

export default function CompanyEditProfileScreen() {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const {
    profile,
    loading,
    saving,
    loadError,
    form,
    setForm,
    canEditProfile,
    hasUnsavedChanges,
    addInterest,
    removeInterest,
    save,
    reload,
  } = useCompanyProfilePage();

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      confirmAlert({
        title: "Discard changes?",
        message: "You have unsaved profile changes.",
        cancelLabel: "Keep editing",
        confirmLabel: "Discard",
        destructive: true,
        onConfirm: () => router.back(),
      });
      return;
    }
    router.back();
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(async () => {
    try {
      const ok = await save();
      if (ok) {
        Alert.alert("Profile saved", "Your company profile was updated.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert("Could not save profile", err instanceof Error ? err.message : "Try again.");
    }
  }, [save]);

  if (!loading && !canEditProfile) {
    return (
      <CompanyScreen edges={[]}>
        <CompanyStackHeader
          title="Edit Profile"
          fallbackHref={COMPANY_ROUTES.profile}
          showAccountMenu={false}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ textAlign: "center", color: colors.muted, fontSize: 15, lineHeight: 22 }}>
            Only the company owner can edit this profile. Contact your company owner to request changes.
          </Text>
        </View>
      </CompanyScreen>
    );
  }

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader
        title="Edit Profile"
        subtitle={COMPANY_PROFILE_SUBTITLE}
        onBack={handleBack}
        fallbackHref={COMPANY_ROUTES.profile}
        showAccountMenu={false}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          contentContainerStyle={[styles.screenPad, { paddingBottom: 120 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading && !profile ? (
            <CompanyProfileSkeleton />
          ) : loadError ? (
            <View style={{ paddingVertical: 40, alignItems: "center", gap: 12 }}>
              <Text style={{ color: colors.muted, textAlign: "center" }}>{loadError}</Text>
              <Pressable onPress={() => void reload()} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : profile ? (
            <CompanyProfileEditForm
              form={form}
              setForm={setForm}
              addInterest={addInterest}
              removeInterest={removeInterest}
            />
          ) : null}
        </ScrollView>

        {profile && canEditProfile ? (
          <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Pressable
              onPress={() => void handleSave()}
              disabled={saving || !hasUnsavedChanges}
              style={({ pressed }) => [
                styles.saveBtn,
                (saving || !hasUnsavedChanges) && styles.saveBtnDisabled,
                pressed && hasUnsavedChanges && !saving && { opacity: 0.92 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save changes</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </CompanyScreen>
  );
}
