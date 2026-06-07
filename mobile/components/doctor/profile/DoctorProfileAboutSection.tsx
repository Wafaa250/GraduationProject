import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { createDoctorProfileStyles } from "@/components/doctor/profile/doctorProfileStyles";
import { useDoctorTheme } from "@/hooks/useDoctorTheme";

const COLLAPSE_AT = 180;

type Props = {
  bio: string;
};

export function DoctorProfileAboutSection({ bio }: Props) {
  const { colors } = useDoctorTheme();
  const styles = useMemo(() => createDoctorProfileStyles(colors), [colors]);
  const text = bio.trim();
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const needsExpand = text.length > COLLAPSE_AT;
  const display = !needsExpand || expanded ? text : `${text.slice(0, COLLAPSE_AT).trim()}…`;

  return (
    <>
      <View style={styles.flatSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionBodyText}>{display}</Text>
        {needsExpand ? (
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            style={styles.expandBtn}
            accessibilityRole="button"
          >
            <Text style={styles.expandBtnText}>{expanded ? "Show less" : "Read more"}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.sheetDivider} />
    </>
  );
}
