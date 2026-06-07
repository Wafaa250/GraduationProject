import { useRef } from "react";
import { Pressable, View } from "react-native";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { useCompanyAccountMenu } from "@/components/company/CompanyAccountMenuProvider";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Props = {
  companyName?: string;
  size?: number;
};

export function CompanyAccountAvatarButton({ companyName, size = 38 }: Props) {
  const colors = useCompanyTheme();
  const { openAccountMenu, companyName: contextName } = useCompanyAccountMenu();
  const displayName = companyName ?? contextName;
  const anchorRef = useRef<View>(null);

  const handlePress = () => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      openAccountMenu({ x, y, width, height });
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open account menu"
      style={({ pressed }) => ({
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View
        ref={anchorRef}
        collapsable={false}
        style={{
          width: size + 4,
          height: size + 4,
          borderRadius: (size + 4) / 2,
          borderWidth: 2,
          borderColor: colors.accentBorder,
          backgroundColor: colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FeedAvatar name={displayName} size={size} roleType="company" />
      </View>
    </Pressable>
  );
}
