import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import {
  ASSOCIATION_CATEGORIES,
  registerStudentAssociation,
  uploadAssociationLogo,
  type MobileLogoFile,
} from "@/api/associationApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { OrganizationLogoUploadMobile } from "@/components/registration/OrganizationLogoUploadMobile";
import { OrganizationOnboardingBadge } from "@/components/registration/OrganizationOnboardingBadge";
import { PasswordStrengthBar } from "@/components/registration/PasswordStrengthBar";
import { RegSelectField } from "@/components/registration/RegSelectField";
import { RegTextField } from "@/components/registration/RegTextField";
import { RegistrationWizardLayout } from "@/components/registration/RegistrationWizardLayout";
import { SocialLinksSection } from "@/components/registration/SocialLinksSection";
import { ASSOCIATION_FACULTIES } from "@/constants/registrationData";
import { persistAuthSession } from "@/lib/authSession";
import { navigateHome } from "@/utils/homeNavigation";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const LOGO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const LOGO_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

const STEP_TITLES = ["Create your organization account", "Organization details"];
const STEP_SUBTITLES = [
  "Register your student organization on SkillSwap.",
  "Tell students about your organization and how to find you.",
];

function validateLogoFile(
  asset: ImagePicker.ImagePickerAsset,
): { ok: true; file: MobileLogoFile; previewUri: string } | { ok: false; message: string } {
  const name = asset.fileName ?? `logo-${Date.now()}.jpg`;
  const mimeType = asset.mimeType ?? "image/jpeg";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  const typeOk = LOGO_MIME_TYPES.has(mimeType.toLowerCase());
  const extOk = LOGO_EXTENSIONS.has(ext);
  if (!typeOk && !extOk) {
    return { ok: false, message: "Only PNG, JPG, JPEG, and WebP images are allowed." };
  }

  if (asset.fileSize && asset.fileSize > MAX_LOGO_BYTES) {
    return { ok: false, message: "Logo must be 5MB or smaller." };
  }

  return {
    ok: true,
    previewUri: asset.uri,
    file: { uri: asset.uri, name, mimeType },
  };
}

export default function AssociationRegisterScreen() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreviewUri, setLogoPreviewUri] = useState<string | null>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<MobileLogoFile | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [form, setForm] = useState({
    associationName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    description: "",
    faculty: "",
    category: "",
    instagramUrl: "",
    facebookUrl: "",
    linkedInUrl: "",
  });

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError(null);
  };

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload your organization logo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    const validated = validateLogoFile(result.assets[0]);
    if (!validated.ok) {
      setLogoError(validated.message);
      return;
    }

    setLogoError(null);
    setLogoPreviewUri(validated.previewUri);
    setPendingLogoFile(validated.file);
  };

  const removeLogo = () => {
    setLogoPreviewUri(null);
    setPendingLogoFile(null);
    setLogoError(null);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!form.associationName.trim()) next.associationName = "Organization name is required";
      if (!form.username.trim()) next.username = "Username is required";
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
        next.username = "Letters, numbers, underscores only";
      }
      if (!form.email.trim()) next.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Invalid email";
      if (!form.password) next.password = "Password is required";
      else if (form.password.length < 8) next.password = "Min. 8 characters";
      if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.faculty) next.faculty = "Faculty is required";
      if (!form.category) next.category = "Category is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    if (isLoading) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await registerStudentAssociation({
        associationName: form.associationName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        description: form.description.trim() || undefined,
        faculty: form.faculty,
        category: form.category,
        instagramUrl: form.instagramUrl.trim() || undefined,
        facebookUrl: form.facebookUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      });
      await persistAuthSession(data);

      if (pendingLogoFile) {
        try {
          await uploadAssociationLogo(pendingLogoFile);
        } catch (logoErr) {
          console.warn("Logo upload failed after registration", parseApiErrorMessage(logoErr));
        }
      }

      await navigateHome();
    } catch (error) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!validate()) return;
    if (step < 1) setStep((s) => s + 1);
    else submit();
  };

  const handleBack = () => {
    if (step === 0) router.replace("/register");
    else setStep((s) => Math.max(0, s - 1));
  };

  return (
    <RegistrationWizardLayout
      stepLabel={`Step ${step + 1} of 2`}
      title={STEP_TITLES[step]}
      subtitle={STEP_SUBTITLES[step]}
      badge={step === 0 ? <OrganizationOnboardingBadge /> : null}
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel={step === 1 ? "Create account" : "Continue"}
      isLoading={isLoading}
      apiError={apiError}
      backLinkLabel={step === 0 ? "← Change account type" : "← Back"}
      keyboardAvoiding
    >
      {step === 0 ? (
        <View style={styles.fullWidth}>
          <RegTextField
            label="Organization name"
            value={form.associationName}
            onChangeText={(v) => setField("associationName", v)}
            placeholder="e.g. NNU Developers Club"
            error={errors.associationName}
          />
          <RegTextField
            label="Username"
            value={form.username}
            onChangeText={(v) => setField("username", v)}
            placeholder="e.g. nnu_devclub"
            autoCapitalize="none"
            error={errors.username}
          />
          <RegTextField
            label="Email"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            placeholder="contact@organization.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <RegTextField
            label="Password"
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            placeholder="Min. 8 characters"
            secureTextEntry
            error={errors.password}
          />
          <PasswordStrengthBar password={form.password} />
          <RegTextField
            label="Confirm password"
            value={form.confirmPassword}
            onChangeText={(v) => setField("confirmPassword", v)}
            placeholder="Re-enter password"
            secureTextEntry
            error={errors.confirmPassword}
          />
        </View>
      ) : (
        <View style={styles.fullWidth}>
          <RegTextField
            label="Description"
            value={form.description}
            onChangeText={(v) => setField("description", v)}
            placeholder="What does your organization do?"
            multiline
            tall
          />
          <RegSelectField
            label="Faculty"
            value={form.faculty}
            onValueChange={(v) => setField("faculty", v)}
            options={ASSOCIATION_FACULTIES}
            placeholder="Select faculty"
            error={errors.faculty}
          />
          <RegSelectField
            label="Category"
            value={form.category}
            onValueChange={(v) => setField("category", v)}
            options={ASSOCIATION_CATEGORIES}
            placeholder="Select category"
            error={errors.category}
          />
          <OrganizationLogoUploadMobile
            previewUri={logoPreviewUri}
            fileName={pendingLogoFile?.name ?? null}
            onPick={() => void pickLogo()}
            onRemove={removeLogo}
            error={logoError}
          />
          <SocialLinksSection
            instagramUrl={form.instagramUrl}
            facebookUrl={form.facebookUrl}
            linkedInUrl={form.linkedInUrl}
            onInstagramChange={(v) => setField("instagramUrl", v)}
            onFacebookChange={(v) => setField("facebookUrl", v)}
            onLinkedInChange={(v) => setField("linkedInUrl", v)}
          />
        </View>
      )}
    </RegistrationWizardLayout>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: "100%",
  },
});
