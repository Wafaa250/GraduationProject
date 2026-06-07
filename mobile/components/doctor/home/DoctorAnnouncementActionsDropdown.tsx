import { Pencil, Trash2 } from "lucide-react-native";
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

import { DOCTOR_RADIUS, doctorElevatedShadow } from "@/components/doctor/ui/doctorDesignSystem";
import type { HubColorScheme } from "@/constants/hubColorSchemes";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

const MENU_WIDTH = 168;
const MENU_HEIGHT = 96;

export type AnnouncementActionsAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  anchor: AnnouncementActionsAnchor | null;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

export function DoctorAnnouncementActionsDropdown({
  visible,
  onClose,
  anchor,
  onEdit,
  onDelete,
  deleting = false,
}: Props) {
  const { colors } = useDoctorTheme();
  const styles = createStyles(colors);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const translateYAnim = useRef(new Animated.Value(-4)).current;

  useEffect(() => {
    if (!visible) {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.96);
      translateYAnim.setValue(-4);
      return;
    }

    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 24, stiffness: 380, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [visible, opacityAnim, scaleAnim, translateYAnim]);

  const closeThen = (action: () => void) => {
    onClose();
    InteractionManager.runAfterInteractions(() => {
      setTimeout(action, 50);
    });
  };

  const screen = Dimensions.get("window");
  const top = anchor
    ? Math.min(anchor.y + anchor.height + 6, screen.height - MENU_HEIGHT - 16)
    : 56;
  const right = anchor ? Math.max(12, screen.width - anchor.x - anchor.width) : 16;

  if (!visible) return null;

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
              transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <Pressable
            onPress={() => closeThen(onEdit)}
            style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.primarySoft }]}
            accessibilityRole="menuitem"
            accessibilityLabel="Edit announcement"
          >
            <Pencil size={16} color={colors.foreground} strokeWidth={2.2} />
            <Text style={styles.menuLabel}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => !deleting && closeThen(onDelete)}
            disabled={deleting}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && !deleting && { backgroundColor: "rgba(220, 38, 38, 0.08)" },
              deleting && { opacity: 0.5 },
            ]}
            accessibilityRole="menuitem"
            accessibilityLabel="Delete announcement"
          >
            <Trash2 size={16} color="#DC2626" strokeWidth={2.2} />
            <Text style={styles.menuLabelDestructive}>Delete</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: HubColorScheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 23, 42, 0.08)",
    },
    dropdown: {
      position: "absolute",
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 4,
      ...doctorElevatedShadow(colors),
      ...Platform.select({
        ios: {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
        },
        android: { elevation: 12 },
        default: {},
      }),
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: DOCTOR_RADIUS.sm,
      marginHorizontal: 4,
      minHeight: 42,
    },
    menuLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
    },
    menuLabelDestructive: {
      fontSize: 14,
      fontWeight: "600",
      color: "#DC2626",
    },
  });
