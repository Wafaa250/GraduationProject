import type { LucideIcon } from "lucide-react-native";

import { ASSOC_COLORS } from "@/constants/associationTheme";

/** Lucide icons — same set and stroke weight as web `AssociationSidebar`. */
type Props = {
  icon: LucideIcon;
  focused: boolean;
  size?: number;
};

export function AssociationTabIcon({ icon: Icon, focused, size = 22 }: Props) {
  return (
    <Icon
      size={size}
      color={focused ? ASSOC_COLORS.accent : ASSOC_COLORS.muted}
      strokeWidth={2}
    />
  );
}
