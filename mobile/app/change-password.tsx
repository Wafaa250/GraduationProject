import { useEffect, useState } from "react";
import { router } from "expo-router";

import { changePassword } from "@/api/authApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { RegTextField } from "@/components/registration/RegTextField";
import { RegistrationWizardLayout } from "@/components/registration/RegistrationWizardLayout";
import { persistAuthSession, setMustChangePassword } from "@/lib/authSession";
import { setStoredCompanyRole } from "@/lib/companyWorkspace";
import { getItem } from "@/utils/authStorage";
import { navigateHome } from "@/utils/homeNavigation";

export default function ChangePasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    (async () => {
      const token = await getItem("token");
      const mustChange = await getItem("mustChangePassword");
      if (!token) {
        router.replace("/login");
        return;
      }
      if (mustChange !== "true") {
        await navigateHome();
      }
    })();
  }, []);

  const submit = async () => {
    if (isLoading) return;
    if (newPassword.length < 8) {
      setApiError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setApiError("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    setApiError(null);
    try {
      const data = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      await persistAuthSession(data);
      await setStoredCompanyRole(data.companyRole ?? null);
      await setMustChangePassword(false);
      await navigateHome();
    } catch (error) {
      setApiError(parseApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RegistrationWizardLayout
      stepLabel="Required security step"
      title="Set your password"
      subtitle="Your account was created with a temporary password. Choose a new password to continue."
      onBack={() => router.replace("/login")}
      onContinue={submit}
      continueLabel="Update password"
      isLoading={isLoading}
      apiError={apiError}
      backLinkLabel="← Back to Sign in"
    >
      <RegTextField label="Temporary / current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      <RegTextField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      <RegTextField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
    </RegistrationWizardLayout>
  );
}
