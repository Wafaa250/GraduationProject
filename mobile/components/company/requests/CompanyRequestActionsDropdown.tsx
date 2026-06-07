import { CirclePause, CirclePlay, CircleX, Pencil, Trash2 } from "lucide-react-native";
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
import type { CompanyRequestLifecycleStatus } from "@/api/companyApi";
import type { CompanyColorScheme } from "@/constants/companyTheme";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

const MENU_WIDTH = 220;

export type RequestActionsAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  anchor: RequestActionsAnchor | null;
  lifecycleStatus: CompanyRequestLifecycleStatus;
  statusLoading?: boolean;
  onEdit: () => void;
  onPause: () => void;
  onReactivate: () => void;
  onCloseRequest: () => void;
  onDelete: () => void;
};

type ActionItem = {
  key: string;
  label: string;
  icon: typeof Pencil;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

export function CompanyRequestActionsDropdown({
  visible,
  onClose,
  anchor,
  lifecycleStatus,
  statusLoading = false,
  onEdit,
  onPause,
  onReactivate,
  onCloseRequest,
  onDelete,
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
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 22,
        stiffness: 360,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacityAnim, scaleAnim, translateYAnim]);

  const isClosed = lifecycleStatus === "closed";
  const isPaused = lifecycleStatus === "paused";
  const isViewOnly = isClosed || isPaused;

  const actions: ActionItem[] = [];

  actions.push({
    key: "edit",
    label: "Edit Request",
    icon: Pencil,
    onPress: onEdit,
    disabled: isViewOnly,
  });

  if (!isClosed && !isPaused) {
    actions.push({
      key: "pause",
      label: "Pause Request",
      icon: CirclePause,
      onPress: onPause,
      disabled: statusLoading,
    });
  }

  if (isPaused) {
    actions.push({
      key: "reactivate",
      label: "Reactivate Request",
      icon: CirclePlay,
      onPress: onReactivate,
      disabled: statusLoading,
    });
  }

  if (!isClosed) {
    actions.push({
      key: "close",
      label: "Close Request",
      icon: CircleX,
      onPress: onCloseRequest,
      disabled: statusLoading,
    });
  }

  actions.push({
    key: "delete",
    label: "Delete Request",
    icon: Trash2,
    onPress: onDelete,
    destructive: true,
  });

  const closeThen = (fn: () => void) => {
    onClose();
    InteractionManager.runAfterInteractions(() => {
      setTimeout(fn, 50);
    });
  };

  const screenWidth = Dimensions.get("window").width;
  const fallbackTop = 56;
  const fallbackRight = 16;

  const top = anchor ? anchor.y + anchor.height + 8 : fallbackTop;
  const right = anchor ? Math.max(12, screenWidth - anchor.x - anchor.width) : fallbackRight;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close request actions" />
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
          <View style={styles.menu}>
            {actions.map((action, index) => {
              const Icon = action.icon;
              const showDivider = action.destructive && index > 0;

              return (
                <View key={action.key}>
                  {showDivider ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={() => !action.disabled && closeThen(action.onPress)}
                    disabled={action.disabled}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && !action.disabled && { backgroundColor: colors.accentSoft },
                      action.disabled && { opacity: 0.45 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    accessibilityState={{ disabled: Boolean(action.disabled) }}
                  >
                    <Icon
                      size={17}
                      color={action.destructive ? "#DC2626" : colors.muted}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.menuLabel,
                        action.destructive && styles.menuLabelDestructive,
                      ]}
                      numberOfLines={1}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: CompanyColorScheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },
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
        ios: {
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 20,
        },
        android: { elevation: 12 },
        default: {},
      }),
    },
    menu: {
      paddingVertical: 2,
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
    menuLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
    },
    menuLabelDestructive: {
      color: "#DC2626",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: 10,
      marginVertical: 4,
    },
  });
