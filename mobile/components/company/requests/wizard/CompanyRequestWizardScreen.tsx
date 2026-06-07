import { router, type Href } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import {
  CompanyRequestBasicsStep,
  CompanyRequestReviewStep,
  CompanyRequestRolesStep,
  CompanyRequestScopeStep,
  CompanyRequestSuccessStep,
  CompanyRequestTypeStep,
} from "@/components/company/requests/wizard/CompanyRequestWizardSteps";
import { createWizardStyles } from "@/components/company/requests/wizard/companyRequestWizardStyles";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyRequestWizard } from "@/hooks/useCompanyRequestWizard";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { WIZARD_STEPS } from "@/lib/companyRequestCatalog";
import { formatDraftSavedAt } from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { COMPANY_NEW_REQUEST_SUBTITLE } from "@/lib/companyWorkspaceCopy";

type Props = {
  editRequestId?: number | null;
};

export function CompanyRequestWizardScreen({ editRequestId = null }: Props) {
  const isEdit = editRequestId != null && editRequestId > 0;
  const colors = useCompanyTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createWizardStyles(colors), [colors]);
  const wizard = useCompanyRequestWizard({ editRequestId: isEdit ? editRequestId : null });

  const progress = (wizard.step + 1) / WIZARD_STEPS.length;
  const cancelHref = isEdit
    ? (COMPANY_ROUTES.requestDetail(editRequestId!) as Href)
    : (COMPANY_ROUTES.requests as Href);

  const renderStep = () => {
    switch (wizard.step) {
      case 0:
        return <CompanyRequestTypeStep wizard={wizard} />;
      case 1:
        return <CompanyRequestBasicsStep wizard={wizard} />;
      case 2:
        return <CompanyRequestRolesStep wizard={wizard} />;
      case 3:
        return <CompanyRequestScopeStep wizard={wizard} />;
      case 4:
        return <CompanyRequestReviewStep wizard={wizard} />;
      default:
        return null;
    }
  };

  if (wizard.loadError) {
    return (
      <CompanyScreen edges={[]}>
        <CompanyStackHeader
          title={isEdit ? "Edit Request" : "Create Request"}
          subtitle={isEdit ? "Update project requirements" : COMPANY_NEW_REQUEST_SUBTITLE}
          fallbackHref={cancelHref}
          showAccountMenu={false}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: HOME_SPACE.xl }}>
          <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 22 }}>
            {wizard.loadError}
          </Text>
        </View>
      </CompanyScreen>
    );
  }

  if (wizard.created) {
    const detailId = wizard.savedRequestId ?? (isEdit ? editRequestId : null);
    return (
      <CompanyScreen edges={[]}>
        <CompanyStackHeader
          title={isEdit ? "Request updated" : "Request created"}
          subtitle={
            isEdit
              ? "Your changes are saved"
              : "Your project request is saved"
          }
          fallbackHref={detailId ? (COMPANY_ROUTES.requestDetail(detailId) as Href) : cancelHref}
          showAccountMenu={false}
        />
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: HOME_SPACE.lg,
            paddingBottom: insets.bottom + HOME_SPACE.xxxl,
          }}
        >
          <CompanyRequestSuccessStep
            savedRequestId={detailId}
            isEdit={isEdit}
            onViewRequest={() => {
              if (detailId) {
                router.replace(COMPANY_ROUTES.requestDetail(detailId) as Href);
              }
            }}
            onAllRequests={() => router.replace(COMPANY_ROUTES.requests as Href)}
            onDashboard={() => router.replace(COMPANY_ROUTES.dashboard as Href)}
          />
        </ScrollView>
      </CompanyScreen>
    );
  }

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader
        title={isEdit ? "Edit Request" : "Create Request"}
        subtitle={
          isEdit
            ? "Update roles and scope for this request."
            : COMPANY_NEW_REQUEST_SUBTITLE
        }
        fallbackHref={cancelHref}
        showAccountMenu={false}
      />

      {wizard.draftLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View style={styles.progressWrap}>
            <View style={styles.progressMeta}>
              <Text style={styles.progressLabel}>{WIZARD_STEPS[wizard.step]}</Text>
              <Text style={styles.progressStep}>
                Step {wizard.step + 1} of {WIZARD_STEPS.length}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          {!isEdit && wizard.draftUpdatedAt ? (
            <Text style={styles.draftMeta}>
              {wizard.draftRestored ? "Draft restored · " : ""}
              Last saved {formatDraftSavedAt(wizard.draftUpdatedAt)}
            </Text>
          ) : null}

          {wizard.stepError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{wizard.stepError}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: HOME_SPACE.xl }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderStep()}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, HOME_SPACE.md) }]}>
            {wizard.step === 4 ? (
              <View style={styles.footerReview}>
                <View style={{ flexDirection: "row", gap: HOME_SPACE.sm }}>
                  <Pressable
                    onPress={wizard.goBack}
                    style={styles.backBtn}
                    accessibilityLabel="Go back"
                  >
                    <Text style={styles.backBtnText}>Back</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                </View>
                {!isEdit ? (
                  <Pressable
                    onPress={() => void wizard.saveDraft()}
                    disabled={wizard.savingDraft || wizard.submitting}
                    style={[styles.outlineBtn, (wizard.savingDraft || wizard.submitting) && { opacity: 0.5 }]}
                  >
                    <Text style={styles.outlineBtnText}>
                      {wizard.savingDraft ? "Saving…" : "Save draft"}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => void wizard.submit()}
                  disabled={wizard.submitting || wizard.savingDraft}
                  style={[
                    styles.primaryBtn,
                    { flex: undefined, width: "100%" },
                    (wizard.submitting || wizard.savingDraft) && styles.primaryBtnDisabled,
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {wizard.submitting
                      ? isEdit
                        ? "Saving…"
                        : "Creating…"
                      : isEdit
                        ? "Save changes"
                        : "Create Request"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={wizard.goBack}
                  disabled={wizard.step === 0}
                  style={[styles.backBtn, wizard.step === 0 && { opacity: 0.35 }]}
                >
                  <Text style={styles.backBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={wizard.goNext}
                  style={[styles.primaryBtn, !wizard.canContinue && styles.primaryBtnDisabled]}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </CompanyScreen>
  );
}
