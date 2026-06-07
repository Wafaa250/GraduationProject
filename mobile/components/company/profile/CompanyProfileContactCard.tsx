import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { ExternalLink, Globe, Link2, Mail } from "lucide-react-native";
import { useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { CompanyProfileSection } from "@/components/company/profile/CompanyProfileSections";
import { createCompanyProfileStyles } from "@/components/company/profile/companyProfileStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { displayUrl, emptyLabel, normalizeExternalUrl } from "@/lib/companyProfileUtils";

type Props = {
  linkedInUrl?: string | null;
  optionalContactLink?: string | null;
  contactEmail?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  /** Skip outer section wrapper when nested inside an accordion. */
  embedded?: boolean;
};

export function CompanyProfileContactCard({
  linkedInUrl,
  optionalContactLink,
  contactEmail,
  email,
  websiteUrl,
  embedded = false,
}: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);

  const publishedEmail = emptyLabel(contactEmail ?? email, "No contact email specified");
  const linkedIn = linkedInUrl?.trim() ?? "";
  const contactLink = optionalContactLink?.trim() ?? "";
  const website = websiteUrl?.trim() ?? "";

  const openUrl = async (url: string) => {
    const normalized = normalizeExternalUrl(url);
    try {
      const supported = await Linking.canOpenURL(normalized);
      if (!supported) {
        Alert.alert("Cannot open link", normalized);
        return;
      }
      await Linking.openURL(normalized);
    } catch {
      Alert.alert("Cannot open link", normalized);
    }
  };

  const openEmail = async () => {
    const addr = (contactEmail ?? email)?.trim();
    if (!addr) return;
    await openUrl(`mailto:${addr}`);
  };

  return embedded ? (
    <ContactLinksBody
      linkedIn={linkedIn}
      contactLink={contactLink}
      publishedEmail={publishedEmail}
      website={website}
      hasEmail={Boolean((contactEmail ?? email)?.trim())}
      openUrl={openUrl}
      openEmail={openEmail}
      styles={styles}
      colors={colors}
    />
  ) : (
    <CompanyProfileSection title="Contact & Links">
      <ContactLinksBody
        linkedIn={linkedIn}
        contactLink={contactLink}
        publishedEmail={publishedEmail}
        website={website}
        hasEmail={Boolean((contactEmail ?? email)?.trim())}
        openUrl={openUrl}
        openEmail={openEmail}
        styles={styles}
        colors={colors}
      />
    </CompanyProfileSection>
  );
}

function ContactLinksBody({
  linkedIn,
  contactLink,
  publishedEmail,
  website,
  hasEmail,
  openUrl,
  openEmail,
  styles,
  colors,
}: {
  linkedIn: string;
  contactLink: string;
  publishedEmail: string;
  website: string;
  hasEmail: boolean;
  openUrl: (url: string) => Promise<void>;
  openEmail: () => Promise<void>;
  styles: ReturnType<typeof createCompanyProfileStyles>;
  colors: ReturnType<typeof useCompanyTheme>;
}) {
  return (
    <>
      <LinkDisplayRow
        iconNode={<Ionicons name="logo-linkedin" size={17} color={colors.accent} />}
        label="LinkedIn"
        value={linkedIn ? displayUrl(linkedIn) : "No LinkedIn specified"}
        onOpen={linkedIn ? () => void openUrl(linkedIn) : undefined}
        styles={styles}
        colors={colors}
      />
      <LinkDisplayRow
        icon={Link2}
        label="Contact link"
        value={contactLink ? displayUrl(contactLink) : "No contact link specified"}
        onOpen={contactLink ? () => void openUrl(contactLink) : undefined}
        styles={styles}
        colors={colors}
      />
      <LinkDisplayRow
        icon={Mail}
        label="Published email"
        value={publishedEmail}
        onOpen={hasEmail ? () => void openEmail() : undefined}
        styles={styles}
        colors={colors}
      />
      {website ? (
        <LinkDisplayRow
          icon={Globe}
          label="Website"
          value={displayUrl(website)}
          onOpen={() => void openUrl(website)}
          styles={styles}
          colors={colors}
          isLast
        />
      ) : (
        <LinkDisplayRow
          icon={Globe}
          label="Website"
          value="No website specified"
          styles={styles}
          colors={colors}
          isLast
        />
      )}
    </>
  );
}

function LinkDisplayRow({
  icon: Icon,
  iconNode,
  label,
  value,
  onOpen,
  styles,
  colors,
  isLast,
}: {
  icon?: typeof Mail;
  iconNode?: React.ReactNode;
  label: string;
  value: string;
  onOpen?: () => void;
  styles: ReturnType<typeof createCompanyProfileStyles>;
  colors: ReturnType<typeof useCompanyTheme>;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.linkRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <View style={styles.infoIcon}>
          {iconNode ?? (Icon ? <Icon size={17} color={colors.accent} strokeWidth={2} /> : null)}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={[styles.infoValue, { fontWeight: "500" }]} numberOfLines={2}>
            {value}
          </Text>
        </View>
      </View>
      {onOpen ? (
        <Pressable onPress={onOpen} style={styles.linkOpen} hitSlop={8} accessibilityLabel={`Open ${label}`}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={styles.linkOpenText}>Open</Text>
            <ExternalLink size={12} color={colors.accent} strokeWidth={2.2} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
