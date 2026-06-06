import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  listOrganizationRecruitmentApplications,
  type RecruitmentApplicationListItem,
  type RecruitmentApplicationStatus,
} from "@/api/recruitmentApplicationsApi";
import type { RecruitmentPosition } from "@/api/recruitmentCampaignsApi";
import { AssociationActionButton } from "@/components/association/AssociationActionButton";
import { AssociationCard } from "@/components/association/AssociationCard";
import { AssociationListEmpty } from "@/components/association/AssociationListEmpty";
import { AssociationLoadingState } from "@/components/association/AssociationLoadingState";
import { AssociationSelectField } from "@/components/association/AssociationSelectField";
import { associationCardStyles } from "@/constants/associationCardStyles";
import { ASSOC_COLORS } from "@/constants/associationTheme";
import { associationRecruitmentApplicationPath } from "@/lib/associationRoutes";
import { formatEventDate } from "@/lib/eventFormUtils";

const STATUS_OPTIONS = ["", "Pending", "AiSuggested", "Accepted", "Rejected"] as const;

const STATUS_LABELS: Record<RecruitmentApplicationStatus, string> = {
  Pending: "Pending",
  AiSuggested: "AI Suggested",
  Accepted: "Accepted",
  Rejected: "Rejected",
};

type Props = {
  campaignId: number;
  positions: RecruitmentPosition[];
  onCountChange?: (count: number) => void;
};

export function CampaignApplicationsSection({ campaignId, positions, onCountChange }: Props) {
  const [applications, setApplications] = useState<RecruitmentApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const positionOptions = useMemo(
    () => ["All positions", ...positions.map((p) => p.roleTitle)],
    [positions],
  );

  const statusOptions = useMemo(
    () => ["All statuses", ...STATUS_OPTIONS.filter(Boolean).map((s) => STATUS_LABELS[s as RecruitmentApplicationStatus])],
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const positionId =
        positionFilter && positionFilter !== "All positions"
          ? positions.find((p) => p.roleTitle === positionFilter)?.id
          : undefined;
      const status =
        statusFilter && statusFilter !== "All statuses"
          ? (Object.entries(STATUS_LABELS).find(([, label]) => label === statusFilter)?.[0] as
              | RecruitmentApplicationStatus
              | undefined)
          : undefined;

      const data = await listOrganizationRecruitmentApplications(campaignId, {
        positionId,
        status,
      });
      setApplications(data);
      if (!positionId && !status) onCountChange?.(data.length);
    } catch (err) {
      setApplications([]);
      onCountChange?.(0);
      console.warn(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [campaignId, onCountChange, positionFilter, positions, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<number, RecruitmentApplicationListItem[]>();
    for (const p of positions) map.set(p.id, []);
    for (const app of applications) {
      const list = map.get(app.positionId) ?? [];
      list.push(app);
      map.set(app.positionId, list);
    }
    return map;
  }, [applications, positions]);

  const positionIdFilter =
    positionFilter && positionFilter !== "All positions"
      ? positions.find((p) => p.roleTitle === positionFilter)?.id
      : undefined;

  return (
    <View style={styles.wrap}>
      <Text style={associationCardStyles.sectionTitle}>Selection applications</Text>
      <Text style={styles.hint}>Review submissions from students who applied to your open roles.</Text>

      <View style={styles.filters}>
        <View style={{ flex: 1 }}>
          <AssociationSelectField
            label="Position"
            value={positionFilter || "All positions"}
            onValueChange={setPositionFilter}
            options={positionOptions}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AssociationSelectField
            label="Status"
            value={statusFilter || "All statuses"}
            onValueChange={setStatusFilter}
            options={statusOptions}
          />
        </View>
      </View>

      {loading ? (
        <AssociationLoadingState message="Loading applications…" />
      ) : applications.length === 0 ? (
        <AssociationListEmpty
          title="No applications"
          description="No selection applications yet for this filter."
        />
      ) : positionIdFilter != null ? (
        <ApplicationList campaignId={campaignId} items={applications} />
      ) : (
        positions.map((position) => {
          const items = grouped.get(position.id) ?? [];
          if (items.length === 0) return null;
          return (
            <View key={position.id} style={styles.group}>
              <Text style={styles.groupTitle}>{position.roleTitle}</Text>
              <ApplicationList campaignId={campaignId} items={items} />
            </View>
          );
        })
      )}
    </View>
  );
}

function ApplicationList({
  campaignId,
  items,
}: {
  campaignId: number;
  items: RecruitmentApplicationListItem[];
}) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((app) => (
        <AssociationCard key={app.id} compact>
          <Text style={styles.appName}>{app.studentName}</Text>
          <Text style={styles.appMeta}>
            {app.positionRoleTitle} · {STATUS_LABELS[app.status]} · {formatEventDate(app.submittedAt)}
          </Text>
          {app.studentMajor ? <Text style={styles.appMeta}>{app.studentMajor}</Text> : null}
          <View style={{ marginTop: 8 }}>
            <AssociationActionButton
              label="Review application"
              variant="outline"
              compact
              onPress={() =>
                router.push(associationRecruitmentApplicationPath(campaignId, app.id) as Href)
              }
            />
          </View>
        </AssociationCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 12, marginTop: 8 },
  hint: { color: ASSOC_COLORS.muted, fontSize: 13, lineHeight: 18 },
  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  group: { gap: 8, marginTop: 4 },
  groupTitle: { fontWeight: "800", color: ASSOC_COLORS.foreground, fontSize: 15 },
  appName: { fontWeight: "800", color: ASSOC_COLORS.foreground, fontSize: 15 },
  appMeta: { color: ASSOC_COLORS.muted, fontSize: 12, marginTop: 2 },
});
