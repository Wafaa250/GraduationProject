import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { aiPanelStyles as S } from "./aiRecommendationPanelStyles";

export type AiRecommendationPanelUiState =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error";

export interface AiRecommendationPanelProps {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  actionLabel: string;
  loadingActionLabel?: string;
  loadingTitle?: string;
  loadingSub?: string;
  onAction: () => void;
  uiState: AiRecommendationPanelUiState;
  errorMessage?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  canTrigger: boolean;
  permissionHint?: string;
  actionDisabled?: boolean;
  resultCount?: number;
  resultNoun?: string;
  children?: React.ReactNode;
  sectionStyle?: StyleProp<ViewStyle>;
}

export function AiRecommendationPanel({
  title,
  subtitle,
  iconName,
  iconColor = "#6366f1",
  actionLabel,
  loadingActionLabel = "Analyzing…",
  loadingTitle = "Finding matches",
  loadingSub = "This may take a few seconds.",
  onAction,
  uiState,
  errorMessage,
  emptyTitle = "No matches returned",
  emptyDescription = "Try again in a few minutes or refine your project skills and abstract.",
  canTrigger,
  permissionHint = "Only the project owner or team leader can run AI recommendations.",
  actionDisabled = false,
  resultCount = 0,
  resultNoun = "recommendation",
  children,
  sectionStyle,
}: AiRecommendationPanelProps) {
  const [listExpanded, setListExpanded] = useState(true);
  const isLoading = uiState === "loading";
  const hasResults = uiState === "success" && resultCount > 0;
  const primaryDisabled = isLoading || actionDisabled || !canTrigger;

  useEffect(() => {
    if (hasResults) setListExpanded(true);
  }, [hasResults, resultCount]);

  const resultLabel =
    resultCount === 1 ? `1 ${resultNoun}` : `${resultCount} ${resultNoun}s`;

  return (
    <View style={[S.section, sectionStyle]}>
      <View style={S.blockHeader}>
        <View style={S.blockTitleRow}>
          <View style={S.iconWrap}>
            <Ionicons name={iconName} size={18} color={iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.blockTitle}>{title}</Text>
            <Text style={S.blockSub}>{subtitle}</Text>
          </View>
        </View>
      </View>

      {!canTrigger ? (
        <Text style={S.hintMuted}>{permissionHint}</Text>
      ) : (
        <View style={S.actionsRow}>
          <Pressable
            onPress={onAction}
            disabled={primaryDisabled}
            style={[S.primaryBtn, primaryDisabled && S.primaryBtnDisabled]}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={S.primaryBtnText}>{loadingActionLabel}</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={14} color="#fff" />
                <Text style={S.primaryBtnText}>{actionLabel}</Text>
              </>
            )}
          </Pressable>
          {hasResults ? (
            <Pressable
              onPress={() => setListExpanded((v) => !v)}
              style={S.collapseBtn}
              accessibilityState={{ expanded: listExpanded }}
            >
              <Ionicons
                name={listExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color="#6366f1"
              />
              <Text style={S.collapseBtnText}>
                {listExpanded ? "Hide list" : `Show ${resultLabel}`}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {isLoading ? (
        <View style={S.loadingBox}>
          <ActivityIndicator size="small" color="#6366f1" />
          <View style={{ flex: 1 }}>
            <Text style={S.loadingTitle}>{loadingTitle}</Text>
            <Text style={S.loadingSub}>{loadingSub}</Text>
          </View>
        </View>
      ) : null}

      {uiState === "error" && errorMessage ? (
        <View style={S.errorBox}>
          <Ionicons name="alert-circle" size={20} color="#dc2626" />
          <View style={{ flex: 1 }}>
            <Text style={S.errorTitle}>Could not load recommendations</Text>
            <Text style={S.errorBody}>{errorMessage}</Text>
          </View>
        </View>
      ) : null}

      {uiState === "empty" ? (
        <View style={S.emptyBox}>
          <Ionicons name="people-outline" size={28} color="#94a3b8" />
          <Text style={S.emptyTitle}>{emptyTitle}</Text>
          <Text style={S.emptyDesc}>{emptyDescription}</Text>
        </View>
      ) : null}

      {hasResults ? (
        <>
          <View style={S.resultsBar}>
            <View style={{ flex: 1 }}>
              <Text style={S.resultsBarLabel}>{resultLabel} found</Text>
              <Text style={S.resultsBarMeta}>
                {listExpanded
                  ? "Ranked by AI from your project context"
                  : "List hidden — expand to review matches"}
              </Text>
            </View>
            <Pressable
              onPress={() => setListExpanded((v) => !v)}
              style={S.collapseBtn}
              accessibilityState={{ expanded: listExpanded }}
            >
              <Ionicons
                name={listExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color="#6366f1"
              />
              <Text style={S.collapseBtnText}>
                {listExpanded ? "Collapse" : "Expand"}
              </Text>
            </Pressable>
          </View>
          {listExpanded ? <View style={S.resultsBody}>{children}</View> : null}
        </>
      ) : null}
    </View>
  );
}
