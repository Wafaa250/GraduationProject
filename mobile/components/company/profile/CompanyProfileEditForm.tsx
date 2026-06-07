import { Briefcase, Globe, Mail } from "lucide-react-native";
import { useMemo } from "react";
import { Text, TextInput, View } from "react-native";

import { CompanyProfileInterestEditor } from "@/components/company/profile/CompanyProfileInterestEditor";
import { createCompanyProfileStyles } from "@/components/company/profile/companyProfileStyles";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import type { CompanyProfileFormState } from "@/lib/companyProfileUtils";
import { displayUrl, emptyLabel } from "@/lib/companyProfileUtils";
import {
  COMPANY_PROFILE_WORKSPACE_NOTE_SHORT,
} from "@/lib/companyWorkspaceCopy";

type Props = {
  form: CompanyProfileFormState;
  setForm: React.Dispatch<React.SetStateAction<CompanyProfileFormState>>;
  addInterest: (value: string) => void;
  removeInterest: (tag: string) => void;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  styles,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  styles: ReturnType<typeof createCompanyProfileStyles>;
  colors: ReturnType<typeof useCompanyTheme>;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      />
    </View>
  );
}

function ReadOnlyRow({
  icon: Icon,
  label,
  value,
  styles,
  colors,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  styles: ReturnType<typeof createCompanyProfileStyles>;
  colors: ReturnType<typeof useCompanyTheme>;
}) {
  return (
    <View style={[styles.infoRow, styles.infoRowLast, { paddingVertical: 0, marginBottom: 12 }]}>
      <View style={styles.infoIcon}>
        <Icon size={17} color={colors.accent} strokeWidth={2} />
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

export function CompanyProfileEditForm({ form, setForm, addInterest, removeInterest }: Props) {
  const colors = useCompanyTheme();
  const styles = useMemo(() => createCompanyProfileStyles(colors), [colors]);

  return (
    <View style={{ gap: 4 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company details</Text>
        <Field
          label="Company name"
          value={form.companyName}
          onChangeText={(companyName) => setForm((prev) => ({ ...prev, companyName }))}
          styles={styles}
          colors={colors}
        />
        <Field
          label="About"
          value={form.about}
          onChangeText={(about) => setForm((prev) => ({ ...prev, about }))}
          multiline
          styles={styles}
          colors={colors}
        />
        <Field
          label="Industry"
          value={form.industry}
          onChangeText={(industry) => setForm((prev) => ({ ...prev, industry }))}
          styles={styles}
          colors={colors}
        />
        <Field
          label="Headquarters / location"
          value={form.headquartersLocation}
          onChangeText={(headquartersLocation) => setForm((prev) => ({ ...prev, headquartersLocation }))}
          styles={styles}
          colors={colors}
        />
        <Field
          label="Working style"
          value={form.workingStyle}
          onChangeText={(workingStyle) => setForm((prev) => ({ ...prev, workingStyle }))}
          styles={styles}
          colors={colors}
        />
        <CompanyProfileInterestEditor
          values={form.areasOfInterest}
          onAdd={addInterest}
          onRemove={removeInterest}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & links</Text>
        <Field
          label="LinkedIn"
          value={form.linkedInUrl}
          onChangeText={(linkedInUrl) => setForm((prev) => ({ ...prev, linkedInUrl }))}
          styles={styles}
          colors={colors}
        />
        <Field
          label="Optional contact link"
          value={form.optionalContactLink}
          onChangeText={(optionalContactLink) => setForm((prev) => ({ ...prev, optionalContactLink }))}
          styles={styles}
          colors={colors}
        />
        <ReadOnlyRow
          icon={Mail}
          label="Published contact email"
          value={emptyLabel(form.contactEmail, "No contact email specified")}
          styles={styles}
          colors={colors}
        />
        <ReadOnlyRow
          icon={Globe}
          label="Published website"
          value={form.website ? displayUrl(form.website) : "No website specified"}
          styles={styles}
          colors={colors}
        />
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Published email and website come from registration. Contact support to update them.
          </Text>
        </View>
      </View>

      <View style={[styles.section, { marginBottom: 0 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.infoIcon}>
            <Briefcase size={17} color={colors.accent} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Company workspace</Text>
            <Text style={[styles.noteText, { marginTop: 4 }]}>{COMPANY_PROFILE_WORKSPACE_NOTE_SHORT}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
