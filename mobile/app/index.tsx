import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SkillSwapLogo } from "@/components/auth/SkillSwapLogo";
import { SS } from "@/constants/skillswapTheme";
import { spacing } from "@/constants/responsiveLayout";

const PREVIEW_MATCHES = [
  { score: 96, name: "Layla Hassan", role: "Frontend", reason: "Covers UI/UX gap" },
  { score: 92, name: "Omar Khalid", role: "NLP Engineer", reason: "Published NLP paper" },
  { score: 88, name: "Dr. Reem Al-Saadi", role: "Supervisor", reason: "EdTech research overlap" },
] as const;

const STEPS = [
  { n: "01", title: "Build profile", desc: "Skills, interests, what you're looking for." },
  { n: "02", title: "AI analyzes", desc: "Profile + project signals scored together." },
  { n: "03", title: "Get matched", desc: "Teammates, supervisors, companies, campaigns." },
  { n: "04", title: "Collaborate", desc: "Invite, accept, start working — together." },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function LandingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...SS.gradientSurface]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <SkillSwapLogo size="sm" />
        </View>

        <View style={styles.hero}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color={SS.ai} />
            <Text style={styles.badgeText}>AI matching for university collaboration</Text>
          </View>

          <Text style={styles.headline}>
            Put the <Text style={styles.headlineAccent}>right person</Text> in the right{" "}
            <Text style={styles.headlineAi}>project</Text>.
          </Text>

          <Text style={styles.subhead}>
            AI-powered collaboration for university projects, teams, and opportunities.
          </Text>

          <Pressable
            style={styles.primaryBtnWrap}
            onPress={() => router.push("/register")}
          >
            <LinearGradient
              colors={[...SS.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={SS.primaryForeground} />
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.outlineBtn} onPress={() => router.push("/login")}>
            <Text style={styles.outlineBtnText}>Sign in</Text>
          </Pressable>
        </View>

        <View style={styles.previewOuter}>
          <View style={styles.previewInner}>
            {PREVIEW_MATCHES.map((m) => (
              <View key={m.name} style={styles.matchCard}>
                <View style={styles.matchTop}>
                  <LinearGradient
                    colors={[...SS.gradientPrimary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>{initials(m.name)}</Text>
                  </LinearGradient>
                  <View style={styles.scorePill}>
                    <Text style={styles.scoreText}>{m.score}%</Text>
                  </View>
                </View>
                <Text style={styles.matchName}>{m.name}</Text>
                <Text style={styles.matchRole}>{m.role}</Text>
                <View style={styles.matchReasonRow}>
                  <Ionicons name="sparkles" size={12} color={SS.ai} />
                  <Text style={styles.matchReason}>{m.reason}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionKicker}>How it works</Text>
          <Text style={styles.sectionTitle}>Four steps, no friendship politics.</Text>
          <View style={styles.stepsGrid}>
            {STEPS.map((s) => (
              <View key={s.n} style={styles.stepCard}>
                <Text style={styles.stepNum}>{s.n}</Text>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          style={styles.ctaWrap}
          onPress={() => router.push("/register")}
        >
          <LinearGradient
            colors={[...SS.gradientHero]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Ionicons name="flash" size={32} color={SS.primaryForeground} />
            <Text style={styles.ctaTitle}>Ready to find your perfect collaborators?</Text>
            <Text style={styles.ctaSub}>
              Set up in 90 seconds. Get your first AI matches instantly.
            </Text>
            <View style={styles.ctaBtn}>
              <Text style={styles.ctaBtnText}>Start matching</Text>
              <Ionicons name="arrow-forward" size={16} color={SS.primary} />
            </View>
          </LinearGradient>
        </Pressable>

        <Text style={styles.footer}>
          SkillSwap · AI-powered university matching · Graduation project prototype
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SS.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SS.aiSoftBorder,
    backgroundColor: SS.aiSoft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: SS.ai,
  },
  headline: {
    marginTop: spacing.lg,
    fontSize: 32,
    fontWeight: "800",
    color: SS.foreground,
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    color: SS.primaryBright,
  },
  headlineAi: {
    color: SS.ai,
  },
  subhead: {
    marginTop: spacing.md,
    fontSize: 16,
    lineHeight: 24,
    color: SS.muted,
    textAlign: "center",
    maxWidth: 360,
  },
  primaryBtnWrap: {
    marginTop: spacing.xl,
    width: "100%",
    maxWidth: 320,
    borderRadius: 14,
    overflow: "hidden",
    ...SS.shadowGlow,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryBtnText: {
    color: SS.primaryForeground,
    fontSize: 16,
    fontWeight: "700",
  },
  outlineBtn: {
    marginTop: spacing.md,
    width: "100%",
    maxWidth: 320,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SS.border,
    backgroundColor: SS.card,
    alignItems: "center",
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: SS.foreground,
  },
  previewOuter: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SS.border,
    backgroundColor: SS.card,
    padding: 4,
    marginBottom: spacing.xxl,
    ...SS.shadowPop,
  },
  previewInner: {
    borderRadius: 20,
    backgroundColor: "#faf9fc",
    padding: spacing.lg,
    gap: spacing.md,
  },
  matchCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SS.border,
    backgroundColor: SS.card,
    padding: spacing.md,
    ...SS.shadowSoft,
  },
  matchTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "800",
    color: SS.primaryForeground,
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: SS.aiSoft,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "800",
    color: SS.ai,
  },
  matchName: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: "700",
    color: SS.foreground,
  },
  matchRole: {
    fontSize: 12,
    color: SS.muted,
  },
  matchReasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: SS.border,
  },
  matchReason: {
    flex: 1,
    fontSize: 11,
    color: SS.ai,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: SS.primaryBright,
    textAlign: "center",
  },
  sectionTitle: {
    marginTop: spacing.sm,
    fontSize: 24,
    fontWeight: "800",
    color: SS.foreground,
    textAlign: "center",
  },
  stepsGrid: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SS.border,
    backgroundColor: SS.card,
    padding: spacing.lg,
    ...SS.shadowSoft,
  },
  stepNum: {
    fontSize: 28,
    fontWeight: "800",
    color: SS.primaryBright,
  },
  stepTitle: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: "700",
    color: SS.foreground,
  },
  stepDesc: {
    marginTop: 4,
    fontSize: 14,
    color: SS.muted,
    lineHeight: 20,
  },
  ctaWrap: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...SS.shadowPop,
  },
  cta: {
    padding: spacing.xl,
    alignItems: "center",
  },
  ctaTitle: {
    marginTop: spacing.md,
    fontSize: 22,
    fontWeight: "800",
    color: SS.primaryForeground,
    textAlign: "center",
  },
  ctaSub: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SS.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: SS.primary,
  },
  footer: {
    fontSize: 11,
    color: SS.muted,
    textAlign: "center",
    lineHeight: 16,
  },
});
