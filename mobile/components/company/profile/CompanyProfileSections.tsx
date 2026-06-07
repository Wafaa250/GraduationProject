import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Building2 } from "lucide-react-native";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { FeedAvatar } from "@/components/communication/FeedAvatar";
import { createCompanyProfileStyles } from "@/components/company/profile/companyProfileStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import {
  COMPANY_PROFILE_WORKSPACE_NOTE,
} from "@/lib/companyWorkspaceCopy";

type Props = {
  companyName: string;
  industry?: string | null;
  location?: string | null;
};

export function CompanyProfileHero({ companyName, industry, location }: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);
  const meta = [industry?.trim(), location?.trim()].filter(Boolean).join(" · ");

  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={[colors.accentSoft, colors.accentMuted, colors.cardBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      />
      <View style={styles.heroBody}>
        <View style={styles.avatarWrap}>
          <FeedAvatar name={companyName} size={68} roleType="company" />
        </View>
        <Text style={styles.heroName} numberOfLines={2}>
          {companyName}
        </Text>
        {meta ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Building2 size={14} color={colors.muted} strokeWidth={2} />
            <Text style={styles.heroMeta} numberOfLines={2}>
              {meta}
            </Text>
          </View>
        ) : null}
        {location?.trim() ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <MapPin size={13} color={colors.subtle} strokeWidth={2} />
            <Text style={{ fontSize: 13, color: colors.muted }} numberOfLines={1}>
              {location.trim()}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function CompanyProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function CompanyProfileInfoItem({
  icon: Icon,
  label,
  value,
  isLast,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);

  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <View style={styles.infoIcon}>
        <Icon size={18} color={colors.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function CompanyProfileInterestChips({ tags }: { tags: string[] }) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);

  if (tags.length === 0) {
    return <Text style={styles.emptyText}>No focus areas specified.</Text>;
  }

  return (
    <View style={styles.chipWrap}>
      {tags.map((tag) => (
        <View key={tag} style={styles.chip}>
          <Text style={styles.chipText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

export function CompanyProfileDiscoveryNote() {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);

  return (
    <View style={styles.noteBox}>
      <Text style={styles.noteText}>{COMPANY_PROFILE_WORKSPACE_NOTE}</Text>
    </View>
  );
}
