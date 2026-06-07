import { useLocalSearchParams } from "expo-router";

import { CompanyRequestWizardScreen } from "@/components/company/requests/wizard/CompanyRequestWizardScreen";

export default function CompanyEditRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);

  return (
    <CompanyRequestWizardScreen
      editRequestId={Number.isFinite(requestId) && requestId > 0 ? requestId : null}
    />
  );
}
