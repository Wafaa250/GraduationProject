import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { companyScreenStyle } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Props = {
  children: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
};

export function CompanyScreen({ children, edges = ["top"], style }: Props) {
  const colors = useCompanyTheme();

  return (
    <SafeAreaView style={[companyScreenStyle(colors), style]} edges={edges}>
      <View style={styles.flex}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
