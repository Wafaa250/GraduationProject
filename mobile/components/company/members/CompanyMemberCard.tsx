import { Crown, MoreVertical } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { CompanyMember } from "@/api/companyApi";
import {
  CompanyMemberActionsDropdown,
  type MemberActionsAnchor,
} from "@/components/company/members/CompanyMemberActionsDropdown";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { memberInitials } from "@/lib/companyMembers";
import { formatCompanyRole } from "@/lib/companyWorkspace";

type Props = {
  member: CompanyMember;
  isSelf: boolean;
  removing: boolean;
  onRemove: () => void;
};

export function CompanyMemberCard({ member, isSelf, removing, onRemove }: Props) {
  const colors = useCompanyTheme();
  const isOwnerRole = member.role.toLowerCase() === "owner";
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<MemberActionsAnchor | null>(null);
  const menuRef = useRef<View>(null);

  const openMenu = () => {
    menuRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setMenuOpen(true);
    });
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: HOME_SPACE.md,
          padding: HOME_SPACE.md,
          borderRadius: COMPANY_RADIUS.lg,
          backgroundColor: isOwnerRole ? colors.accentSoft : colors.surfaceMuted,
          borderWidth: 1,
          borderColor: isOwnerRole ? colors.accentBorder : colors.border,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isOwnerRole ? colors.accent : colors.cardBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "800",
              fontSize: 14,
              color: isOwnerRole ? "#FFFFFF" : colors.accent,
            }}
          >
            {memberInitials(member.name)}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
              {member.name}
            </Text>
            {isSelf ? (
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: COMPANY_RADIUS.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted }}>You</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {member.email}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            {isOwnerRole ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: COMPANY_RADIUS.pill,
                  backgroundColor: colors.accent,
                }}
              >
                <Crown size={11} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>
                  {formatCompanyRole(member.role)}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: COMPANY_RADIUS.pill,
                  backgroundColor: colors.cardBg,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary }}>
                  {formatCompanyRole(member.role)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!isSelf ? (
          <View ref={menuRef} collapsable={false}>
            <Pressable
              onPress={openMenu}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: COMPANY_RADIUS.sm,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.88 : 1,
              })}
              accessibilityLabel={`Actions for ${member.name}`}
            >
              <MoreVertical size={18} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {!isSelf ? (
        <CompanyMemberActionsDropdown
          visible={menuOpen}
          onClose={() => {
            setMenuOpen(false);
            setAnchor(null);
          }}
          anchor={anchor}
          memberName={member.name}
          removing={removing}
          onRemove={onRemove}
        />
      ) : null}
    </>
  );
}
