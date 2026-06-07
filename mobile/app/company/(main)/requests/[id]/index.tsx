import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { ClipboardList, FileText, MoreVertical, Sparkles, StickyNote, Target } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  deleteCompanyProjectRequest,
  getCompanyProjectRequest,
  parseApiErrorMessage,
  publishCompanyProjectRequest,
  unpublishCompanyProjectRequest,
  updateCompanyProjectRequestStatus,
  type CompanyProjectRequestDetail,
} from "@/api/companyApi";
import { CompanyEmptyState } from "@/components/company/home/CompanyEmptyState";
import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import {
  CompanyRequestActionsDropdown,
  type RequestActionsAnchor,
} from "@/components/company/requests/CompanyRequestActionsDropdown";
import { CompanyRequestVisibilitySection } from "@/components/company/requests/CompanyRequestVisibilitySection";
import { createRequestStyles } from "@/components/company/requests/requestStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { CompanyAccordionSection } from "@/components/company/ui/CompanyAccordionSection";
import { CompanyScreen } from "@/components/company/ui/CompanyScreen";
import { CompanyStackHeader } from "@/components/company/ui/CompanyStackHeader";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import {
  formatCollaborationLine,
  formatRequestDuration,
  getRequestLifecycleStatus,
  getRequestProjectTitle,
  getRequestRoleLabels,
  getRequestRoleSubtitle,
  getRequestSkillLabels,
  isRequestViewOnly,
  requestLifecycleStatusColors,
  requestLifecycleStatusLabel,
  requestTypeLabel,
} from "@/lib/companyRequestDisplay";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import {
  COMPANY_PAGE_META,
  COMPANY_RECOMMENDATIONS_STUDENTS_DESC,
} from "@/lib/companyWorkspaceCopy";

export default function CompanyRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const colors = useCompanyTheme();
  const styles = useMemo(() => createRequestStyles(colors), [colors]);
  const [request, setRequest] = useState<CompanyProjectRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<RequestActionsAnchor | null>(null);
  const actionsButtonRef = useRef<View>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!Number.isFinite(requestId) || requestId < 1) {
        setError("Invalid request.");
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        setRequest(await getCompanyProjectRequest(requestId));
        setError(null);
      } catch (err) {
        setError(parseApiErrorMessage(err));
        setRequest(null);
      } finally {
        setLoading(false);
      }
    },
    [requestId],
  );

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const lifecycle = request ? getRequestLifecycleStatus(request) : "active";
  const viewOnly = isRequestViewOnly(lifecycle);
  const statusColors = requestLifecycleStatusColors(request?.requestStatus ?? "active");
  const title = request ? getRequestProjectTitle(request) : "Request Details";
  const roleSubtitle = request ? getRequestRoleSubtitle(request) : null;
  const skills = request ? getRequestSkillLabels(request) : [];
  const roles = request ? getRequestRoleLabels(request) : [];

  const setLifecycleStatus = async (status: string, successMessage: string) => {
    if (!request) return;
    setStatusLoading(true);
    try {
      setRequest(await updateCompanyProjectRequestStatus(request.id, status));
      Alert.alert("Updated", successMessage);
    } catch (err) {
      Alert.alert("Could not update request", parseApiErrorMessage(err));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = () => {
    if (!request) return;
    Alert.alert("Delete request?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteCompanyProjectRequest(request.id);
              router.replace(COMPANY_ROUTES.requests as Href);
            } catch (err) {
              Alert.alert("Could not delete request", parseApiErrorMessage(err));
            }
          })();
        },
      },
    ]);
  };

  const openActionsMenu = () => {
    actionsButtonRef.current?.measureInWindow((x, y, width, height) => {
      setActionsAnchor({ x, y, width, height });
      setActionsOpen(true);
    });
  };

  const closeActionsMenu = () => {
    setActionsOpen(false);
    setActionsAnchor(null);
  };

  const headerRight = request ? (
    <View ref={actionsButtonRef} collapsable={false}>
      <Pressable
        onPress={openActionsMenu}
        hitSlop={8}
        style={{
          width: 40,
          height: 40,
          borderRadius: COMPANY_RADIUS.sm,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
        }}
        accessibilityLabel="Request actions"
        accessibilityRole="button"
      >
        <MoreVertical size={18} color={colors.foreground} strokeWidth={2.2} />
      </Pressable>
    </View>
  ) : null;

  return (
    <CompanyScreen edges={[]}>
      <CompanyStackHeader
        title={title}
        subtitle={COMPANY_PAGE_META.requestDetail}
        fallbackHref={COMPANY_ROUTES.requests}
        right={headerRight}
        showAccountMenu={false}
      />

      {loading && !request ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={{ padding: HOME_SPACE.lg }}>
          <CompanyEmptyState icon={FileText} message={error} actionLabel="Retry" onAction={() => void load()} />
        </View>
      ) : request ? (
        <>
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
            }
            contentContainerStyle={[styles.screenPad, { gap: HOME_SPACE.md }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: colors.accent, letterSpacing: 1 }}>
                PROJECT REQUEST
              </Text>
              <Text style={[styles.heroTitle, { marginTop: 8 }]}>{title}</Text>
              {roleSubtitle ? (
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{roleSubtitle}</Text>
              ) : null}
              {request.description?.trim() ? (
                <Text style={styles.heroDesc}>{request.description.trim()}</Text>
              ) : null}
              <View style={[styles.chipWrap, { marginTop: 12 }]}>
                {request.category ? (
                  <View style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{request.category}</Text>
                  </View>
                ) : null}
                {roles.slice(0, 2).map((role) => (
                  <View key={role} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{role}</Text>
                  </View>
                ))}
                {request.collaborationType ? (
                  <View style={styles.skillChip}>
                    <Text style={styles.skillChipText}>
                      {formatCollaborationLine(request.collaborationType)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }}>
                <View style={[styles.badge, { backgroundColor: colors[statusColors.bg] }]}>
                  <Text style={[styles.badgeText, { color: colors[statusColors.text] }]}>
                    {requestLifecycleStatusLabel(request.requestStatus)}
                  </Text>
                </View>
              </View>
            </View>

            <CompanyRequestVisibilitySection
              request={request}
              publishing={publishLoading}
              onPublish={() => {
                void (async () => {
                  setPublishLoading(true);
                  try {
                    setRequest(await publishCompanyProjectRequest(request.id));
                    Alert.alert("Published", "Opportunity published to Communication Hub.");
                  } catch (err) {
                    Alert.alert("Could not publish", parseApiErrorMessage(err));
                  } finally {
                    setPublishLoading(false);
                  }
                })();
              }}
              onUnpublish={() => {
                void (async () => {
                  setPublishLoading(true);
                  try {
                    setRequest(await unpublishCompanyProjectRequest(request.id));
                    Alert.alert("Removed", "Opportunity removed from Communication Hub.");
                  } catch (err) {
                    Alert.alert("Could not unpublish", parseApiErrorMessage(err));
                  } finally {
                    setPublishLoading(false);
                  }
                })();
              }}
            />

            <CompanyAccordionSection
              title="Request specifications"
              icon={ClipboardList}
              summary={`${requestTypeLabel(request.requestType)} · ${formatRequestDuration(request)}`}
            >
              <View style={{ paddingTop: HOME_SPACE.sm }}>
                <SpecRow label="Type" value={requestTypeLabel(request.requestType)} styles={styles} colors={colors} />
                <SpecRow label="Category" value={request.category || "—"} styles={styles} colors={colors} />
                <SpecRow
                  label="Duration"
                  value={formatRequestDuration(request)}
                  styles={styles}
                  colors={colors}
                />
                <SpecRow
                  label="Format"
                  value={request.collaborationType ? formatCollaborationLine(request.collaborationType) : "—"}
                  styles={styles}
                  colors={colors}
                />
                <SpecRow
                  label="Status"
                  value={requestLifecycleStatusLabel(request.requestStatus)}
                  styles={styles}
                  colors={colors}
                  isLast
                />
              </View>
            </CompanyAccordionSection>

            <CompanyAccordionSection
              title="Requirements"
              icon={Target}
              summary={
                roles.length > 0
                  ? `${roles.slice(0, 2).join(" · ")}${skills.length > 0 ? ` · ${skills.length} skills` : ""}`
                  : skills.length > 0
                    ? `${skills.length} skills listed`
                    : "No requirements listed"
              }
            >
              <View style={{ paddingTop: HOME_SPACE.sm }}>
                {roles.length > 0 ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.sectionLabel}>Role</Text>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginTop: 6 }}>
                      {roles.join(" · ")}
                    </Text>
                  </View>
                ) : null}
                {skills.length > 0 ? (
                  <View>
                    <Text style={styles.sectionLabel}>Skills</Text>
                    <View style={styles.chipWrap}>
                      {skills.map((skill) => (
                        <View key={skill} style={styles.chip}>
                          <Text style={styles.chipText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={{ fontSize: 14, color: colors.muted }}>No skills listed.</Text>
                )}
              </View>
            </CompanyAccordionSection>

            {request.scopeNotes?.trim() ? (
              <CompanyAccordionSection
                title="Additional notes"
                icon={StickyNote}
                summary={request.scopeNotes.trim()}
              >
                <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textSecondary, paddingTop: HOME_SPACE.sm }}>
                  {request.scopeNotes.trim()}
                </Text>
              </CompanyAccordionSection>
            ) : null}

            <View style={[styles.card, { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }]}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                AI recommendations
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 6 }}>
                {COMPANY_RECOMMENDATIONS_STUDENTS_DESC}
              </Text>
              <Pressable
                onPress={() => router.push(COMPANY_ROUTES.requestRecommendations(request.id) as Href)}
                disabled={viewOnly && false}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { marginTop: 14 },
                  pressed && { opacity: 0.92 },
                ]}
              >
                <Sparkles size={16} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.primaryBtnText}>
                  {viewOnly ? "View AI recommendations" : "View AI recommendations"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          <CompanyRequestActionsDropdown
            visible={actionsOpen}
            onClose={closeActionsMenu}
            anchor={actionsAnchor}
            lifecycleStatus={lifecycle}
            statusLoading={statusLoading}
            onEdit={() => {
              if (viewOnly || !request) return;
              router.push(COMPANY_ROUTES.editRequest(request.id) as Href);
            }}
            onPause={() => {
              void setLifecycleStatus("Paused", "Request paused.");
            }}
            onReactivate={() => {
              void setLifecycleStatus("Active", "Request reactivated.");
            }}
            onCloseRequest={() => {
              Alert.alert("Close request?", "Recommendations remain visible but saving is disabled.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Close request",
                  onPress: () => void setLifecycleStatus("Closed", "Request closed."),
                },
              ]);
            }}
            onDelete={handleDelete}
          />
        </>
      ) : null}
    </CompanyScreen>
  );
}

function SpecRow({
  label,
  value,
  styles,
  colors,
  isLast,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createRequestStyles>;
  colors: ReturnType<typeof useCompanyTheme>;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.specRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={[styles.specValue, { color: colors.foreground }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
