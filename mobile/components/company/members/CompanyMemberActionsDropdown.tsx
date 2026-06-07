import { Trash2 } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COMPANY_RADIUS, companyElevatedShadow } from "@/components/company/ui/companyDesignSystem";
import type { CompanyColorScheme } from "@/constants/companyTheme";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

const MENU_WIDTH = 200;

export type MemberActionsAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  anchor: MemberActionsAnchor | null;
  memberName: string;
  removing?: boolean;
  onRemove: () => void;
};

export function CompanyMemberActionsDropdown({
  visible,
  onClose,
  anchor,
  memberName,
  removing = false,
  onRemove,
}: Props) {
  const colors = useCompanyTheme();
  const styles = createStyles(colors);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const translateYAnim = useRef(new Animated.Value(-6)).current;

  useEffect(() => {
    if (!visible) {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.94);
      translateYAnim.setValue(-6);
      return;
    }
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 22, stiffness: 360, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [visible, opacityAnim, scaleAnim, translateYAnim]);

  const closeThen = (fn: () => void) => {
    onClose();
    InteractionManager.runAfterInteractions(() => {
      setTimeout(fn, 50);
    });
  };

  const screenWidth = Dimensions.get("window").width;
  const top = anchor ? anchor.y + anchor.height + 8 : 56;
  const right = anchor ? Math.max(12, screenWidth - anchor.x - anchor.width) : 16;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
        </Animated.View>
        <Animated.View
          style={[
            styles.dropdown,
            {
              top,
              right,
              width: MENU_WIDTH,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            },
          ]}
        >
          <Pressable
            onPress={() => !removing && closeThen(onRemove)}
            disabled={removing}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && !removing && { backgroundColor: colors.accentSoft },
              removing && { opacity: 0.5 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${memberName}`}
          >
            <Trash2 size={17} color="#DC2626" strokeWidth={2.2} />
            <Text style={styles.menuLabelDestructive}>Remove member</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: CompanyColorScheme) =>
  StyleSheet.create({
    overlay: { flex: 1 },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    dropdown: {
      position: "absolute",
      backgroundColor: colors.cardBg,
      borderRadius: COMPANY_RADIUS.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 6,
      ...companyElevatedShadow(colors),
      ...Platform.select({
        ios: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20 },
        android: { elevation: 12 },
        default: {},
      }),
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: COMPANY_RADIUS.sm,
      marginHorizontal: 4,
      minHeight: 44,
    },
    menuLabelDestructive: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: "#DC2626",
    },
  });
