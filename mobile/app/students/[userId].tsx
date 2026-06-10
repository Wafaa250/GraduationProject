import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import type { GradProject } from "@/api/gradProjectApi";
import { getStudentDirectoryProfile } from "@/api/studentDirectoryApi";
import { getMe } from "@/api/meApi";
import { getGraduationProjectsForStudent } from "@/api/studentProfileApi";
import { StudentPublicProfileView } from "@/components/public-profile/StudentPublicProfileView";
import { PublicProfileShell } from "@/components/student/PublicProfileShell";
import { HUB_COLORS } from "@/constants/studentHubTheme";
import { mapDirectoryProfileToMe } from "@/lib/mapStudentDirectoryProfile";
import { openStudentDirectMessage } from "@/lib/openStudentDirectMessage";

export default function PublicStudentProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [projects, setProjects] = useState<GradProject[]>([]);
  const [profile, setProfile] = useState<ReturnType<typeof mapDirectoryProfileToMe> | null>(null);
  const numericUserId = Number(userId);

  useEffect(() => {
    void getMe()
      .then((me) => setCurrentUserId(me.userId))
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      setError("Invalid profile.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const directoryProfile = await getStudentDirectoryProfile(numericUserId);
        const mapped = mapDirectoryProfileToMe(directoryProfile);
        setProfile(mapped);
        const projectRes = await getGraduationProjectsForStudent(mapped.profileId).catch(
          () => [] as GradProject[],
        );
        setProjects(projectRes);
      } catch (err) {
        setProfile(null);
        setProjects([]);
        setError(parseApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [numericUserId]);

  const canMessage =
    currentUserId != null &&
    currentUserId > 0 &&
    profile != null &&
    profile.userId !== currentUserId;

  const handleMessage = async () => {
    if (!profile || !canMessage) return;
    setMessaging(true);
    try {
      await openStudentDirectMessage(profile.userId);
    } catch (err) {
      Alert.alert("Could not start conversation", parseApiErrorMessage(err));
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <PublicProfileShell title="Student Profile" fallbackHref="/feed">
        <ActivityIndicator color={HUB_COLORS.primary} style={{ marginTop: 24 }} />
      </PublicProfileShell>
    );
  }

  if (error || !profile) {
    return (
      <PublicProfileShell title="Student Profile" fallbackHref="/feed">
        <Text style={styles.error}>{error ?? "Profile not found"}</Text>
      </PublicProfileShell>
    );
  }

  return (
    <PublicProfileShell title={profile.name} fallbackHref="/feed">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StudentPublicProfileView
          profile={profile}
          projects={projects}
          onMessage={canMessage ? () => void handleMessage() : undefined}
          messaging={messaging}
        />
      </ScrollView>
    </PublicProfileShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  error: {
    color: HUB_COLORS.muted,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 20,
  },
});
