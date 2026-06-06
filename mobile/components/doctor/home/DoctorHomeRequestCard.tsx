import { Check, X } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { DoctorStatusBadge } from "@/components/doctor/DoctorStatusBadge";
import { createDoctorHomeStyles, HOME_SPACE } from "@/components/doctor/home/doctorHomeStyles";
import { useHubTheme } from "@/contexts/ThemePreferenceContext";
import type { DoctorRequestCardModel } from "@/lib/doctorHubMappers";

type Props = {
  request: DoctorRequestCardModel;
  busy?: boolean;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  showDivider?: boolean;
};

export function DoctorHomeRequestCard({ request, busy, onAccept, onReject, showDivider }: Props) {
  const { colors } = useHubTheme();
  const styles = createDoctorHomeStyles(colors);
  const pending = request.status === "pending";
  const skills = request.skills.slice(0, 2);

  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <View style={{ paddingVertical: HOME_SPACE.md, paddingHorizontal: HOME_SPACE.md }}>
        <View style={{ flexDirection: "row", gap: HOME_SPACE.sm }}>
          <FeedAvatar name={request.student} size={42} roleType="student" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, flex: 1 }} numberOfLines={1}>
                {request.student}
              </Text>
              <DoctorStatusBadge status={request.status} />
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2, fontWeight: "500" }} numberOfLines={1}>
              {request.major}
            </Text>
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: 8, lineHeight: 20 }}
              numberOfLines={2}
            >
              {request.title}
            </Text>

            {skills.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {skills.map((skill) => (
                  <View key={skill} style={[styles.pill, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.pillText, { color: colors.primary }]}>{skill}</Text>
                  </View>
                ))}
                {request.skills.length > 2 ? (
                  <View style={[styles.pill, { backgroundColor: colors.border }]}>
                    <Text style={[styles.pillText, { color: colors.muted }]}>+{request.skills.length - 2}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8, fontWeight: "500" }}>
              Team of {request.team} · {request.date}
            </Text>

            {pending ? (
              <View style={{ flexDirection: "row", gap: HOME_SPACE.sm, marginTop: HOME_SPACE.md }}>
                <Pressable
                  onPress={() => onReject?.(request.requestId)}
                  disabled={busy}
                  style={({ pressed }) => ({
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: "rgba(239,68,68,0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.18)",
                    opacity: busy ? 0.6 : pressed ? 0.9 : 1,
                  })}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <X size={14} color="#EF4444" strokeWidth={2.5} />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#EF4444" }}>Reject</Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => onAccept?.(request.requestId)}
                  disabled={busy}
                  style={({ pressed }) => ({
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    opacity: busy ? 0.6 : pressed ? 0.9 : 1,
                  })}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Check size={14} color="#FFF" strokeWidth={2.5} />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFF" }}>Accept</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
