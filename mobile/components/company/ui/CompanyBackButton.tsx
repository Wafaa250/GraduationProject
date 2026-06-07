import type { Href } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, type ViewStyle } from "react-native";

import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { navigateBack } from "@/lib/mobileBackNavigation";

type Props = {
  onBack?: () => void;
  /** Only used when navigation history is unavailable (deep links). */
  fallbackHref?: Href | string;
  size?: number;
};

export function CompanyBackButton({ onBack, fallbackHref, size = 40 }: Props) {
  const colors = useCompanyTheme();

  return (
    <Pressable
      onPress={() => {
        if (onBack) {
          onBack();
          return;
        }
        navigateBack(fallbackHref);
      }}
      hitSlop={8}
      style={({ pressed }) =>
        ({
          width: size,
          height: size,
          borderRadius: COMPANY_RADIUS.sm,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.88 : 1,
          backgroundColor: colors.cardBg,
        }) as ViewStyle
      }
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <ChevronLeft size={20} color={colors.foreground} strokeWidth={2.2} />
    </Pressable>
  );
}
