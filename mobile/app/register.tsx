import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { AccountTypeCard } from "@/components/auth/AccountTypeCard";
import { AuthScreenLayout } from "@/components/auth/AuthScreenLayout";
import { GradientAuthButton } from "@/components/auth/GradientAuthButton";
import { AUTH_COLORS } from "@/constants/authTheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type AccountType = "student" | "doctor" | "association" | "company";

const ACCOUNT_TYPES: {
  id: AccountType;
  title: string;
  description: string;
  icon: "school-outline" | "book-outline" | "business-outline" | "briefcase-outline";
}[] = [
  {
    id: "student",
    title: "Student",
    description: "Build your profile, find teammates, and join AI-formed project teams.",
    icon: "school-outline",
  },
  {
    id: "doctor",
    title: "Doctor",
    description: "Supervise projects and mentor student teams in your field.",
    icon: "book-outline",
  },
  {
    id: "association",
    title: "Organization",
    description: "Run initiatives, recruit members, and connect with students.",
    icon: "business-outline",
  },
  {
    id: "company",
    title: "Company",
    description: "Post project needs and discover matching student talent.",
    icon: "briefcase-outline",
  },
];

export default function RegisterScreen() {
  const layout = useResponsiveLayout();
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  const dynamic = useMemo(
    () => ({
      stepBadge: {
        paddingHorizontal: layout.space("md"),
        paddingVertical: layout.space("xs") + 2,
        borderRadius: layout.scale(999),
        marginBottom: layout.space("lg"),
        gap: layout.space("xs"),
      },
      stepText: { fontSize: layout.scale(12) },
      title: {
        fontSize: layout.fontSize.title,
        lineHeight: layout.fontSize.title * 1.15,
        marginBottom: layout.space("md"),
      },
      description: {
        fontSize: layout.fontSize.subtitle,
        lineHeight: layout.fontSize.subtitle * 1.5,
        marginBottom: layout.space("xxl"),
      },
      gridRow: {
        gap: layout.space("md"),
        marginBottom: layout.space("md"),
      },
      backLink: {
        marginTop: layout.space("xl"),
        fontSize: layout.fontSize.footer,
      },
    }),
    [layout]
  );

  const rowPairs: [AccountType, AccountType][] = [
    ["student", "doctor"],
    ["association", "company"],
  ];

  const getType = (id: AccountType) => ACCOUNT_TYPES.find((item) => item.id === id)!;

  const handleContinue = () => {
    if (!selectedType) return;
    const routes: Record<AccountType, Href> = {
      student: "/register/student",
      doctor: "/register/doctor",
      company: "/register/company",
      association: "/register/association",
    };
    router.push(routes[selectedType]);
  };

  return (
    <AuthScreenLayout>
      <View style={[styles.stepBadge, dynamic.stepBadge]}>
        <Text style={[styles.stepText, dynamic.stepText]} maxFontSizeMultiplier={1.2}>
          Step 1 of 2 · Choose account type
        </Text>
      </View>

      <Text style={[styles.title, dynamic.title]} maxFontSizeMultiplier={1.3}>
        Choose your <Text style={styles.titleAccent}>SkillSwap</Text> account type
      </Text>

      <Text style={[styles.description, dynamic.description]} maxFontSizeMultiplier={1.3}>
        Choose how you want to participate in SkillSwap. Your registration fields and workspace
        will be tailored to your role.
      </Text>

      {rowPairs.map(([leftId, rightId]) => {
        const left = getType(leftId);
        const right = getType(rightId);

        return (
          <View key={`${leftId}-${rightId}`} style={[styles.gridRow, dynamic.gridRow]}>
            <AccountTypeCard
              title={left.title}
              description={left.description}
              icon={left.icon}
              selected={selectedType === left.id}
              onPress={() => setSelectedType(left.id)}
            />
            <AccountTypeCard
              title={right.title}
              description={right.description}
              icon={right.icon}
              selected={selectedType === right.id}
              onPress={() => setSelectedType(right.id)}
            />
          </View>
        );
      })}

      <GradientAuthButton
        label="Continue"
        onPress={handleContinue}
        disabled={!selectedType}
        icon={<Ionicons name="arrow-forward" size={layout.scale(18)} color="#FFFFFF" />}
      />

      <Pressable onPress={() => router.push("/login")} hitSlop={layout.space("sm")} style={styles.backPressable}>
        <Text style={[styles.backLink, dynamic.backLink]} maxFontSizeMultiplier={1.2}>
          ← Back to Sign in
        </Text>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  stepBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AUTH_COLORS.cardBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  stepText: {
    fontWeight: "600",
    color: AUTH_COLORS.muted,
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: -0.5,
    color: AUTH_COLORS.foreground,
    flexShrink: 1,
  },
  titleAccent: {
    color: AUTH_COLORS.primary,
  },
  description: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    flexShrink: 1,
    width: "100%",
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  backPressable: {
    alignSelf: "center",
  },
  backLink: {
    textAlign: "center",
    color: AUTH_COLORS.muted,
    fontWeight: "500",
  },
});
