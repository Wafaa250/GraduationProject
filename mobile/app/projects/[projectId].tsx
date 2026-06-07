import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getGraduationProjectById,
  getGraduationProjectMembers,
  joinGraduationProject,
  resolveProjectTypeLabel,
  type GradProject,
} from "@/api/gradProjectApi";
import { ChipList } from "@/components/student/ChipList";
import { HubSectionCard } from "@/components/student/HubSectionCard";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { Pressable } from "react-native";

export default function BrowseProjectDetailScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const numericId = Number(projectId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<GradProject | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setError("Invalid project link.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const [details, members] = await Promise.all([
          getGraduationProjectById(numericId),
          getGraduationProjectMembers(numericId).catch(() => null),
        ]);
        setProject(details);
        setMemberCount(members?.members.length ?? details.members?.length ?? details.currentMembers ?? 0);
      } catch (err) {
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [numericId]);

  const handleJoin = async () => {
    if (!project) return;
    setJoining(true);
    try {
      await joinGraduationProject(project.id);
      Alert.alert("Request sent", "Your join request was submitted.");
    } catch (err) {
      Alert.alert("Could not join project", parseApiErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <PublicProfileShell title="Project" fallbackHref="/feed">
        <ActivityIndicator color={HUB_COLORS.primary} />
      </PublicProfileShell>
    );
  }

  if (error || !project) {
    return (
      <PublicProfileShell title="Project" fallbackHref="/feed">
        <Text style={styles.error}>{error ?? "Project not found."}</Text>
      </PublicProfileShell>
    );
  }

  return (
    <PublicProfileShell title={project.name} fallbackHref="/feed">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.meta}>
          {[
            resolveProjectTypeLabel(project),
            project.ownerFaculty,
            project.ownerMajor,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        <Text style={styles.description}>{project.description ?? project.abstract ?? ""}</Text>

        {(project.requiredSkills?.length ?? 0) > 0 ? (
          <HubSectionCard title="Skills">
            <ChipList items={project.requiredSkills ?? []} />
          </HubSectionCard>
        ) : null}

        <HubSectionCard title="Team">
          <Text style={styles.teamMeta}>
            {memberCount} member{memberCount === 1 ? "" : "s"}
            {project.partnersCount ? ` · max ${project.partnersCount}` : ""}
          </Text>
        </HubSectionCard>

        <Pressable
          style={[styles.primaryBtn, joining && styles.btnDisabled]}
          onPress={() => void handleJoin()}
          disabled={joining}
        >
          <Text style={styles.primaryBtnText}>{joining ? "Submitting..." : "Request to join"}</Text>
        </Pressable>
      </ScrollView>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 24 },
  error: { color: "#DC2626", lineHeight: 22 },
  meta: { color: HUB_COLORS.muted, fontSize: 14 },
  description: { color: HUB_COLORS.foreground, lineHeight: 22, fontSize: 15 },
  teamMeta: { color: HUB_COLORS.muted, fontSize: 14 },
  primaryBtn: {
    backgroundColor: HUB_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
});
