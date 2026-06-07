import { Globe, Lock } from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { CompanyProjectRequestDetail } from "@/api/companyApi";
import { createRequestStyles } from "@/components/company/requests/requestStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import {
  canPublishRequest,
  canUnpublishRequest,
  getRequestLifecycleStatus,
} from "@/lib/companyRequestDisplay";

type Props = {
  request: CompanyProjectRequestDetail;
  publishing: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
};

export function CompanyRequestVisibilitySection({
  request,
  publishing,
  onPublish,
  onUnpublish,
}: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createRequestStyles(colors), [colors]);
  const lifecycle = getRequestLifecycleStatus(request);
  const published = request.isPublishedToHub ?? false;
  const canPublish = canPublishRequest(request);
  const canUnpublish = canUnpublishRequest(request);

  return (
    <View style={styles.card}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>Visibility</Text>
      <Text style={{ fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 4 }}>
        Choose whether students can discover this opportunity in the Communication Hub.
      </Text>

      <View style={{ marginTop: 16, gap: 10 }}>
        <View
          style={[
            styles.card,
            {
              padding: 14,
              margin: 0,
              borderColor: !published ? colors.accentBorder : colors.border,
              backgroundColor: !published ? colors.accentSoft : colors.cardBg,
            },
          ]}
        >
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <Lock size={18} color={colors.accent} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Private Request</Text>
              <Text style={{ fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 4 }}>
                Visible only in your workspace. AI recommendations are unaffected.
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              padding: 14,
              margin: 0,
              borderColor: published ? colors.accentBorder : colors.border,
              backgroundColor: published ? colors.accentSoft : colors.cardBg,
            },
          ]}
        >
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <Globe size={18} color={colors.accent} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                Published in Communication Hub
              </Text>
              <Text style={{ fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 4 }}>
                Students can discover this opportunity in the campus feed.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {lifecycle !== "active" ? (
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 14, lineHeight: 19 }}>
          Publish and unpublish are available when the request lifecycle is Active.
        </Text>
      ) : canPublish ? (
        <Pressable
          onPress={onPublish}
          disabled={publishing}
          style={({ pressed }) => [styles.primaryBtn, { marginTop: 16 }, pressed && { opacity: 0.92 }]}
        >
          {publishing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Publish Opportunity</Text>
          )}
        </Pressable>
      ) : canUnpublish ? (
        <Pressable
          onPress={onUnpublish}
          disabled={publishing}
          style={({ pressed }) => [styles.secondaryBtn, { marginTop: 16 }, pressed && { opacity: 0.92 }]}
        >
          {publishing ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.secondaryBtnText}>Remove from Communication Hub</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
