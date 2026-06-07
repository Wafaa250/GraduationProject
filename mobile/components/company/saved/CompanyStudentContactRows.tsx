import * as Linking from "expo-linking";
import { ExternalLink, Globe, Mail } from "lucide-react-native";
import { Alert, Pressable, Text, View } from "react-native";

import { HOME_SPACE } from "@/components/company/home/companyHomeStyles";
import { COMPANY_RADIUS } from "@/components/company/ui/companyDesignSystem";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { displayContactValue, normalizeContactUrl } from "@/lib/companyTeamDiscovery";

type ContactFields = {
  email?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
};

type Props = {
  contact: ContactFields;
  compact?: boolean;
};

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href: string;
}) {
  const colors = useCompanyTheme();

  const open = async () => {
    try {
      await Linking.openURL(href);
    } catch {
      Alert.alert("Cannot open link");
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: HOME_SPACE.sm,
        paddingVertical: 8,
        paddingHorizontal: HOME_SPACE.sm,
        borderRadius: COMPANY_RADIUS.sm,
        backgroundColor: colors.surfaceMuted,
      }}
    >
      <Icon size={15} color={colors.accent} strokeWidth={2.2} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 9, fontWeight: "700", color: colors.muted, letterSpacing: 0.5 }}>
          {label.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 1 }} numberOfLines={1}>
          {displayContactValue(value)}
        </Text>
      </View>
      <Pressable
        onPress={() => void open()}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: COMPANY_RADIUS.sm,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>Open</Text>
        <ExternalLink size={12} color={colors.muted} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

export function CompanyStudentContactRows({ contact, compact }: Props) {
  const colors = useCompanyTheme();
  const email = contact.email?.trim();
  const linkedin = contact.linkedin?.trim();
  const github = contact.github?.trim();
  const portfolio = contact.portfolio?.trim();

  if (!email && !linkedin && !github && !portfolio) {
    if (compact) return null;
    return (
      <Text style={{ fontSize: 12, color: colors.muted, fontStyle: "italic" }}>
        No contact links available.
      </Text>
    );
  }

  return (
    <View style={{ gap: compact ? 6 : HOME_SPACE.sm }}>
      {email ? <ContactRow icon={Mail} label="Email" value={email} href={`mailto:${email}`} /> : null}
      {linkedin ? (
        <ContactRow icon={Globe} label="LinkedIn" value={linkedin} href={normalizeContactUrl(linkedin)} />
      ) : null}
      {github ? (
        <ContactRow icon={Globe} label="GitHub" value={github} href={normalizeContactUrl(github)} />
      ) : null}
      {portfolio ? (
        <ContactRow icon={Globe} label="Portfolio" value={portfolio} href={normalizeContactUrl(portfolio)} />
      ) : null}
    </View>
  );
}
