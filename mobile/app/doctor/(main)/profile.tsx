import { router, useFocusEffect, type Href } from "expo-router";
import { AlertCircle, User } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import { DoctorProfileAboutSection } from "@/components/doctor/profile/DoctorProfileAboutSection";
import { DoctorProfileAcademicSection } from "@/components/doctor/profile/DoctorProfileAcademicSection";
import { DoctorProfileContactSection } from "@/components/doctor/profile/DoctorProfileContactSection";
import { DoctorProfileExpertiseSection } from "@/components/doctor/profile/DoctorProfileExpertiseSection";
import { DoctorProfileAvatar, DoctorProfileCover, DoctorProfileHero } from "@/components/doctor/profile/DoctorProfileHero";
import { createDoctorProfileStyles } from "@/components/doctor/profile/doctorProfileStyles";
import { DoctorScreen } from "@/components/doctor/ui/DoctorScreen";
import { DoctorStackHeader } from "@/components/doctor/ui/DoctorStackHeader";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";
import { useDoctorProfilePage } from "@/hooks/useDoctorProfilePage";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

export default function DoctorProfileScreen() {
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createDoctorProfileStyles(colors), [colors]);
  const { loading, data, error, reload } = useDoctorProfilePage();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void reload(true);
    }, [reload]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
  }, [reload]);

  const openEdit = () => router.push(DOCTOR_ROUTES.editProfile as Href);

  if (loading && !data) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="My Profile" variant="compact" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateDesc}>Loading profile…</Text>
        </View>
      </DoctorScreen>
    );
  }

  if (error && !data) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="My Profile" variant="compact" />
        <View style={styles.centerState}>
          <AlertCircle size={40} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.stateTitle}>Could not load profile</Text>
          <Text style={styles.stateDesc}>{error}</Text>
          <Pressable onPress={() => void reload()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </DoctorScreen>
    );
  }

  if (!data) {
    return (
      <DoctorScreen edges={["top"]}>
        <DoctorStackHeader title="My Profile" variant="compact" />
        <View style={styles.centerState}>
          <User size={40} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.stateTitle}>Profile unavailable</Text>
          <Text style={styles.stateDesc}>We could not find your doctor profile.</Text>
        </View>
      </DoctorScreen>
    );
  }

  return (
    <DoctorScreen edges={["top"]}>
      <DoctorStackHeader title="My Profile" subtitle="Your public doctor profile" variant="compact" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <DoctorProfileCover />
        <DoctorProfileAvatar name={data.name} photoUrl={data.photoUrl} />
        <View style={styles.mainSheet}>
          <DoctorProfileHero data={data} onEditPress={openEdit} />

          {data.bio.trim() ? <DoctorProfileAboutSection bio={data.bio} /> : null}

          <DoctorProfileAcademicSection
            faculty={data.faculty}
            department={data.department}
            academicRank={data.academicRank}
            specialization={data.specialization}
            university={data.university}
            yearsOfExperience={data.yearsOfExperience}
          />

          <DoctorProfileExpertiseSection
            technicalSkills={data.technicalSkills}
            researchSkills={data.researchSkills}
            researchInterests={data.researchInterests}
            preferredProjectAreas={data.preferredProjectAreas}
          />

          <DoctorProfileContactSection
            email={data.email}
            officeHours={data.officeHours}
            linkedin={data.linkedin}
          />
        </View>
      </ScrollView>
    </DoctorScreen>
  );
}
